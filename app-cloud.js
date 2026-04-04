(function() {
    const STORAGE_KEY = 'lifeTrackerProfiles';
    const BACKUP_KEY = 'lifeTrackerProfilesBackups';
    const COLLECTION = 'lifeTrackerUsers';

    function hasValidConfig() {
        const cfg = window.FIREBASE_CONFIG || {};
        return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
    }

    function safeParse(value) {
        try {
            return JSON.parse(value || 'null');
        } catch (error) {
            return null;
        }
    }

    function getLocalStore() {
        return safeParse(localStorage.getItem(STORAGE_KEY));
    }

    function getBackups() {
        const backups = safeParse(localStorage.getItem(BACKUP_KEY));
        return Array.isArray(backups) ? backups : [];
    }

    function saveBackups(backups) {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(0, 25)));
    }

    function backupStore(reason, store) {
        if (!store || typeof store !== 'object') {
            return;
        }

        const backups = getBackups();
        backups.unshift({
            reason: reason || 'unknown',
            capturedAt: new Date().toISOString(),
            store
        });
        saveBackups(backups);
    }

    function toTimestamp(value) {
        const parsed = Date.parse(value || '');
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function getProfileCompletionScore(profile) {
        const habits = Array.isArray(profile && profile.habits) ? profile.habits : [];
        return habits.reduce(function(sum, habit) {
            const history = Array.isArray(habit && habit.history) ? habit.history : [];
            return sum + history.length;
        }, 0);
    }

    function getStoreProgress(store) {
        const profiles = store && store.profiles && typeof store.profiles === 'object' ? store.profiles : {};
        const ids = Object.keys(profiles);

        return ids.reduce(function(acc, id) {
            const profile = profiles[id] || {};
            const habits = Array.isArray(profile.habits) ? profile.habits : [];
            acc.totalProfiles += 1;
            acc.totalHabits += habits.length;
            acc.totalCompletions += getProfileCompletionScore(profile);
            return acc;
        }, {
            totalProfiles: 0,
            totalHabits: 0,
            totalCompletions: 0
        });
    }

    function chooseRicherProfile(localProfile, cloudProfile) {
        if (!localProfile) {
            return cloudProfile;
        }

        if (!cloudProfile) {
            return localProfile;
        }

        const localScore = getProfileCompletionScore(localProfile);
        const cloudScore = getProfileCompletionScore(cloudProfile);

        if (localScore > cloudScore) {
            return localProfile;
        }

        if (cloudScore > localScore) {
            return cloudProfile;
        }

        const localLogin = toTimestamp(localProfile.lastLoginAt);
        const cloudLogin = toTimestamp(cloudProfile.lastLoginAt);
        return localLogin >= cloudLogin ? localProfile : cloudProfile;
    }

    function mergeStores(localStore, cloudStore) {
        if (!localStore || typeof localStore !== 'object') {
            return cloudStore;
        }

        if (!cloudStore || typeof cloudStore !== 'object') {
            return localStore;
        }

        const merged = {
            version: 1,
            currentUserId: cloudStore.currentUserId || localStore.currentUserId || '',
            profiles: {},
            updatedAt: new Date(Math.max(toTimestamp(localStore.updatedAt), toTimestamp(cloudStore.updatedAt), Date.now())).toISOString()
        };

        const localProfiles = localStore.profiles && typeof localStore.profiles === 'object' ? localStore.profiles : {};
        const cloudProfiles = cloudStore.profiles && typeof cloudStore.profiles === 'object' ? cloudStore.profiles : {};
        const profileIds = Array.from(new Set(Object.keys(localProfiles).concat(Object.keys(cloudProfiles))));

        profileIds.forEach(function(id) {
            merged.profiles[id] = chooseRicherProfile(localProfiles[id], cloudProfiles[id]);
        });

        if (!merged.currentUserId || !merged.profiles[merged.currentUserId]) {
            merged.currentUserId = Object.keys(merged.profiles)[0] || '';
        }

        return merged;
    }

    function setLocalStore(store, reason) {
        if (!store || typeof store !== 'object') {
            return;
        }

        const existing = getLocalStore();
        if (existing) {
            backupStore(reason || 'cloud-replace', existing);
        }

        const merged = mergeStores(existing, store);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('life-tracker-store-replaced'));
    }

    function shouldProtectLocal(localStore, cloudStore) {
        const local = getStoreProgress(localStore);
        const cloud = getStoreProgress(cloudStore);

        if (local.totalCompletions > 0 && cloud.totalCompletions === 0) {
            return true;
        }

        if (local.totalCompletions > cloud.totalCompletions && local.totalCompletions - cloud.totalCompletions >= 5) {
            return true;
        }

        if (local.totalHabits > cloud.totalHabits && local.totalHabits - cloud.totalHabits >= 2) {
            return true;
        }

        return false;
    }

    let ready = false;
    let auth = null;
    let db = null;
    let provider = null;
    let currentUser = null;

    if (window.firebase && hasValidConfig()) {
        try {
            if (!window.firebase.apps.length) {
                window.firebase.initializeApp(window.FIREBASE_CONFIG);
            }

            auth = window.firebase.auth();
            db = window.firebase.firestore();
            provider = new window.firebase.auth.GoogleAuthProvider();

            auth.onAuthStateChanged(function(user) {
                currentUser = user || null;
                window.dispatchEvent(new CustomEvent('life-tracker-auth-changed', {
                    detail: {
                        user: currentUser
                    }
                }));
            });

            ready = true;
        } catch (error) {
            ready = false;
        }
    }

    function getUserDocRef() {
        if (!ready || !currentUser) {
            return null;
        }

        return db.collection(COLLECTION).doc(currentUser.uid);
    }

    async function pushLocalToCloud() {
        const ref = getUserDocRef();
        if (!ref) {
            return { status: 'no-user' };
        }

        const localStore = getLocalStore();
        if (!localStore) {
            return { status: 'no-local-data' };
        }

        const payload = {
            store: localStore,
            updatedAt: localStore.updatedAt || new Date().toISOString(),
            email: currentUser.email || ''
        };

        await ref.set(payload, { merge: true });
        return { status: 'pushed', user: currentUser };
    }

    async function pullCloudToLocal(options) {
        const ref = getUserDocRef();
        if (!ref) {
            return { status: 'no-user' };
        }

        const force = Boolean(options && options.force);
        const localStore = getLocalStore();
        const snap = await ref.get();
        if (!snap.exists) {
            return { status: 'no-cloud-data' };
        }

        const data = snap.data() || {};
        if (!data.store) {
            return { status: 'invalid-cloud-data' };
        }

        if (!force && localStore && shouldProtectLocal(localStore, data.store)) {
            return { status: 'protected-local' };
        }

        setLocalStore(data.store, 'manual-cloud-pull');
        return { status: 'pulled', user: currentUser };
    }

    async function sync() {
        const ref = getUserDocRef();
        if (!ref) {
            return { status: 'no-user' };
        }

        const localStore = getLocalStore();
        const cloudSnap = await ref.get();

        if (!cloudSnap.exists) {
            if (localStore) {
                await pushLocalToCloud();
                return { status: 'pushed-initial', user: currentUser };
            }

            return { status: 'empty-both', user: currentUser };
        }

        const cloudData = cloudSnap.data() || {};
        const cloudStore = cloudData.store || null;
        const localTs = toTimestamp(localStore && localStore.updatedAt);
        const cloudTs = toTimestamp(cloudData.updatedAt || (cloudStore && cloudStore.updatedAt));

        if (!localStore && cloudStore) {
            setLocalStore(cloudStore, 'sync-no-local');
            return { status: 'pulled', user: currentUser };
        }

        if (cloudTs > localTs && cloudStore) {
            if (localStore && shouldProtectLocal(localStore, cloudStore)) {
                await pushLocalToCloud();
                return { status: 'protected-local-pushed', user: currentUser };
            }

            setLocalStore(cloudStore, 'sync-pulled-newer');
            return { status: 'pulled-newer', user: currentUser };
        }

        if (localStore && localTs >= cloudTs) {
            await pushLocalToCloud();
            return { status: 'pushed-newer', user: currentUser };
        }

        return { status: 'noop', user: currentUser };
    }

    function scheduleAutoSync() {
        if (!ready || !currentUser) {
            return;
        }

        sync().catch(function() {
            // Keep silent to avoid breaking user flow.
        });
    }

    async function signInWithGoogle() {
        if (!ready) {
            throw new Error('Cloud sync is not configured yet.');
        }

        await auth.signInWithPopup(provider);
        return sync();
    }

    async function signOut() {
        if (!ready) {
            return;
        }

        await auth.signOut();
    }

    function restoreLatestBackup() {
        const backups = getBackups();
        if (!backups.length) {
            return { status: 'no-backup' };
        }

        const latest = backups[0];
        if (!latest || !latest.store) {
            return { status: 'invalid-backup' };
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(latest.store));
        window.dispatchEvent(new CustomEvent('life-tracker-store-replaced'));
        return { status: 'restored', capturedAt: latest.capturedAt, reason: latest.reason };
    }

    function getCurrentUser() {
        return currentUser;
    }

    window.HabitTrackerCloud = {
        isReady: function() {
            return ready;
        },
        getCurrentUser,
        signInWithGoogle,
        signOut,
        sync,
        pushLocalToCloud,
        pullCloudToLocal,
        scheduleAutoSync,
        restoreLatestBackup
    };
})();
