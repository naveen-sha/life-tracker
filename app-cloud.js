(function() {
    const STORAGE_KEY = 'lifeTrackerProfiles';
    const COLLECTION = 'lifeTrackerUsers';

    function hasValidConfig() {
        const cfg = window.FIREBASE_CONFIG || {};
        return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
    }

    function getLocalStore() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        } catch (error) {
            return null;
        }
    }

    function setLocalStore(store) {
        if (!store || typeof store !== 'object') {
            return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        window.dispatchEvent(new CustomEvent('life-tracker-store-replaced'));
    }

    function toTimestamp(value) {
        const parsed = Date.parse(value || '');
        return Number.isNaN(parsed) ? 0 : parsed;
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

    async function pullCloudToLocal() {
        const ref = getUserDocRef();
        if (!ref) {
            return { status: 'no-user' };
        }

        const snap = await ref.get();
        if (!snap.exists) {
            return { status: 'no-cloud-data' };
        }

        const data = snap.data() || {};
        if (!data.store) {
            return { status: 'invalid-cloud-data' };
        }

        setLocalStore(data.store);
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
            setLocalStore(cloudStore);
            return { status: 'pulled', user: currentUser };
        }

        if (cloudTs > localTs && cloudStore) {
            setLocalStore(cloudStore);
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
        scheduleAutoSync
    };
})();
