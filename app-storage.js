(function() {
    const STORAGE_KEY = 'lifeTrackerProfiles';
    const DEFAULT_CATEGORIES = ['General', 'Health', 'Productivity', 'Learning'];
    const DEFAULT_SETTINGS = {
        theme: 'light',
        reminders: false,
        reminderTime: '09:00'
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function slugify(name) {
        const slug = (name || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        return slug || `profile-${Date.now()}`;
    }

    function normalizeProfile(profile, fallbackId) {
        const id = profile && profile.id ? profile.id : fallbackId || `profile-${Date.now()}`;
        const name = profile && profile.name ? profile.name : 'My Profile';

        return {
            id,
            name,
            habits: Array.isArray(profile && profile.habits) ? profile.habits : [],
            categories: Array.isArray(profile && profile.categories) && profile.categories.length ? profile.categories : [...DEFAULT_CATEGORIES],
            settings: {
                ...DEFAULT_SETTINGS,
                ...(profile && profile.settings ? profile.settings : {})
            },
            darkMode: Boolean(profile && profile.darkMode),
            lastReset: profile && profile.lastReset ? profile.lastReset : '',
            lastTipUpdate: profile && profile.lastTipUpdate ? profile.lastTipUpdate : '',
            createdAt: profile && profile.createdAt ? profile.createdAt : new Date().toISOString(),
            lastLoginAt: profile && profile.lastLoginAt ? profile.lastLoginAt : new Date().toISOString()
        };
    }

    function createProfile(name, id) {
        return normalizeProfile({
            id: id || slugify(name),
            name: (name || 'My Profile').trim() || 'My Profile'
        }, id);
    }

    function readRawStore() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            return null;
        }
    }

    function writeStore(store) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }

    function getLegacyProfile() {
        const hasLegacyData = [
            'habits',
            'categories',
            'settings',
            'darkMode',
            'lastReset',
            'lastTipUpdate'
        ].some(key => localStorage.getItem(key) !== null);

        if (!hasLegacyData) {
            return null;
        }

        return normalizeProfile({
            id: 'my-profile',
            name: 'My Profile',
            habits: JSON.parse(localStorage.getItem('habits') || '[]'),
            categories: JSON.parse(localStorage.getItem('categories') || 'null') || [...DEFAULT_CATEGORIES],
            settings: JSON.parse(localStorage.getItem('settings') || 'null') || { ...DEFAULT_SETTINGS },
            darkMode: localStorage.getItem('darkMode') === 'true',
            lastReset: localStorage.getItem('lastReset') || '',
            lastTipUpdate: localStorage.getItem('lastTipUpdate') || ''
        }, 'my-profile');
    }

    function ensureStore() {
        const rawStore = readRawStore();
        let store = rawStore && typeof rawStore === 'object'
            ? {
                version: 1,
                currentUserId: rawStore.currentUserId || '',
                profiles: rawStore.profiles && typeof rawStore.profiles === 'object' ? rawStore.profiles : {}
            }
            : null;

        if (!store) {
            const legacyProfile = getLegacyProfile();
            const initialProfile = legacyProfile || createProfile('My Profile', 'my-profile');
            store = {
                version: 1,
                currentUserId: initialProfile.id,
                profiles: {
                    [initialProfile.id]: initialProfile
                }
            };
            writeStore(store);
        }

        const profileIds = Object.keys(store.profiles);
        if (!profileIds.length) {
            const fallbackProfile = createProfile('My Profile', 'my-profile');
            store.profiles[fallbackProfile.id] = fallbackProfile;
            store.currentUserId = fallbackProfile.id;
            writeStore(store);
        }

        profileIds.forEach(id => {
            store.profiles[id] = normalizeProfile(store.profiles[id], id);
        });

        if (!store.profiles[store.currentUserId]) {
            store.currentUserId = Object.keys(store.profiles)[0];
        }

        writeStore(store);
        return store;
    }

    function getCurrentProfileRecord(store) {
        const activeStore = store || ensureStore();
        return activeStore.profiles[activeStore.currentUserId];
    }

    function updateCurrentProfile(mutator) {
        const store = ensureStore();
        const current = clone(getCurrentProfileRecord(store));
        const nextProfile = mutator(current) || current;
        store.profiles[store.currentUserId] = normalizeProfile(nextProfile, store.currentUserId);
        writeStore(store);
        return clone(store.profiles[store.currentUserId]);
    }

    function getCurrentProfile() {
        return clone(getCurrentProfileRecord(ensureStore()));
    }

    function listProfiles() {
        const store = ensureStore();
        return Object.values(store.profiles)
            .map(profile => normalizeProfile(profile, profile.id))
            .sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt))
            .map(profile => ({
                id: profile.id,
                name: profile.name,
                createdAt: profile.createdAt,
                lastLoginAt: profile.lastLoginAt,
                habitsCount: profile.habits.length,
                totalCompletions: profile.habits.reduce((sum, habit) => sum + ((habit.history || []).length || 0), 0),
                active: profile.id === store.currentUserId
            }));
    }

    function createProfileWithName(name) {
        const store = ensureStore();
        const trimmedName = (name || '').trim();
        if (!trimmedName) {
            throw new Error('Profile name is required.');
        }

        let baseId = slugify(trimmedName);
        let candidateId = baseId;
        let index = 2;

        while (store.profiles[candidateId]) {
            candidateId = `${baseId}-${index}`;
            index += 1;
        }

        const profile = createProfile(trimmedName, candidateId);
        store.profiles[profile.id] = profile;
        store.currentUserId = profile.id;
        writeStore(store);
        return clone(profile);
    }

    function switchProfile(id) {
        const store = ensureStore();
        if (!store.profiles[id]) {
            throw new Error('Profile not found.');
        }

        store.currentUserId = id;
        store.profiles[id].lastLoginAt = new Date().toISOString();
        writeStore(store);
        return clone(store.profiles[id]);
    }

    function deleteProfile(id) {
        const store = ensureStore();
        const profileIds = Object.keys(store.profiles);
        if (profileIds.length === 1) {
            throw new Error('At least one profile must remain.');
        }

        if (!store.profiles[id]) {
            return getCurrentProfile();
        }

        delete store.profiles[id];
        if (store.currentUserId === id) {
            store.currentUserId = Object.keys(store.profiles)[0];
            store.profiles[store.currentUserId].lastLoginAt = new Date().toISOString();
        }
        writeStore(store);
        return clone(store.profiles[store.currentUserId]);
    }

    function saveHabits(habits) {
        return updateCurrentProfile(profile => {
            profile.habits = Array.isArray(habits) ? habits : [];
            return profile;
        });
    }

    function saveCategories(categories) {
        return updateCurrentProfile(profile => {
            profile.categories = Array.isArray(categories) && categories.length ? categories : [...DEFAULT_CATEGORIES];
            return profile;
        });
    }

    function saveSettings(settings) {
        return updateCurrentProfile(profile => {
            profile.settings = {
                ...DEFAULT_SETTINGS,
                ...(settings || {})
            };
            return profile;
        });
    }

    function setDarkMode(value) {
        return updateCurrentProfile(profile => {
            profile.darkMode = Boolean(value);
            if (profile.settings.theme !== 'auto') {
                profile.settings.theme = profile.darkMode ? 'dark' : 'light';
            }
            return profile;
        });
    }

    function getMeta(key) {
        const profile = getCurrentProfile();
        return profile[key];
    }

    function setMeta(key, value) {
        return updateCurrentProfile(profile => {
            profile[key] = value;
            return profile;
        });
    }

    function clearCurrentProfileData() {
        return updateCurrentProfile(profile => {
            profile.habits = [];
            profile.categories = [...DEFAULT_CATEGORIES];
            profile.settings = { ...DEFAULT_SETTINGS };
            profile.darkMode = false;
            profile.lastReset = '';
            profile.lastTipUpdate = '';
            return profile;
        });
    }

    function exportCurrentProfile() {
        const profile = getCurrentProfile();
        return {
            profile: clone(profile)
        };
    }

    function importIntoCurrentProfile(data) {
        const incoming = data && data.profile ? data.profile : data;
        return updateCurrentProfile(profile => {
            profile.habits = Array.isArray(incoming && incoming.habits) ? incoming.habits : [];
            profile.categories = Array.isArray(incoming && incoming.categories) && incoming.categories.length
                ? incoming.categories
                : [...DEFAULT_CATEGORIES];
            profile.settings = {
                ...DEFAULT_SETTINGS,
                ...(incoming && incoming.settings ? incoming.settings : {})
            };
            profile.darkMode = Boolean(incoming && incoming.darkMode);
            profile.lastReset = incoming && incoming.lastReset ? incoming.lastReset : '';
            profile.lastTipUpdate = incoming && incoming.lastTipUpdate ? incoming.lastTipUpdate : '';
            return profile;
        });
    }

    window.HabitTrackerStorage = {
        DEFAULT_CATEGORIES,
        DEFAULT_SETTINGS,
        getCurrentProfile,
        listProfiles,
        createProfile: createProfileWithName,
        switchProfile,
        deleteProfile,
        saveHabits,
        saveCategories,
        saveSettings,
        setDarkMode,
        getMeta,
        setMeta,
        clearCurrentProfileData,
        exportCurrentProfile,
        importIntoCurrentProfile
    };
})();
