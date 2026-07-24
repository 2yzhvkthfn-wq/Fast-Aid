// Simple English / French translations
const translations = {
    en: {
        app_name: 'FastAid',
        tagline: 'Urgent Help, Nearby Professionals',
        login: 'Login',
        username: 'Username',
        password: 'Password',
        login_btn: 'Sign In',
        invalid_username: 'Invalid username',
        invalid_password: 'Invalid password',
        login_failed: 'Login failed. Please try again.',
        footer: 'Built with care by Alexandre Nasrallah',
        nav_dashboard: 'Dashboard',
        nav_history: 'History',
        nav_provide_help: 'Provide Help',
        nav_request_help: 'Request Help',
        nav_admin: 'Admin',
        lang_en: 'EN',
        lang_fr: 'FR',
        welcome_requester: 'Welcome',
        welcome_helper: 'Welcome',
        request_help: 'Request Help',
        request_help_now: 'Request Help Now',
        select_category: 'Select an emergency category',
        select_subtype: 'Select the emergency type',
        confirm_location: 'Confirm your location on the map, then submit your request.',
        cat_medical: 'Medical Emergency',
        cat_vehicle: 'Vehicle Emergency',
        cat_home: 'Home Emergency',
        cat_pet: 'Pet Emergency',
        sub_dead_battery: 'Dead Battery',
        sub_flat_tire: 'Flat Tire',
        sub_vehicle_breakdown: 'Vehicle Breakdown',
        sub_other_mechanical: 'Other Mechanical Emergency',
        sub_plumbing: 'Plumbing Emergency',
        sub_electrical: 'Electrical Emergency',
        sub_locksmith: 'Locked Out / Security Emergency',
        sub_heating: 'Heating Emergency',
        back: 'Back',
        change_category: 'Change Category',
        no_helper_available: 'No qualified helper is currently available within 2 km.',
        active_request_exists: 'You already have an active request.',
        waiting_for_helper: 'Waiting for a nearby helper to accept your request...',
        helper_en_route: 'is on the way.',
        contact_phone: 'Phone',
        status_pending: 'Pending',
        status_accepted: 'Accepted',
        status_en_route: 'En route',
        status_arrived: 'Arrived',
        status_completed: 'Completed',
        helper_waiting: 'Waiting for matching requests nearby...',
        incoming_request: 'New urgent request nearby',
        accept: 'Accept',
        accepted: 'Accepted',
        already_accepted: 'This request was already accepted by another helper.',
        update_status: 'Update Status',
        mark_en_route: 'Mark En Route',
        mark_arrived: 'Mark Arrived',
        mark_completed: 'Mark Completed',
        active_request: 'Active Request',
        requester: 'Requester',
        location: 'Location',
        time: 'Time',
        category: 'Category',
        problem_type: 'Problem Type',
        status: 'Status',
        helper: 'Helper',
        no_history: 'No history yet.',
        requester_history_title: 'Your Request History',
        helper_history_title: 'Your Assistance History',
        admin_title: 'Administration',
        admin_users: 'Users',
        admin_requests: 'Requests',
        admin_map: 'Activity Map',
        admin_create_user: 'Create User',
        admin_save: 'Save',
        admin_delete: 'Delete',
        admin_edit: 'Edit',
        admin_display_name: 'Display Name',
        admin_phone: 'Phone',
        admin_can_request: 'Can Request',
        admin_can_help: 'Can Help',
        admin_profession: 'Profession',
        admin_is_admin: 'Administrator',
        admin_address: 'Address',
        admin_lng: 'Longitude',
        admin_lat: 'Latitude',
        admin_username: 'Username',
        admin_password: 'Password',
        map_legend_pending: 'Pending requests',
        map_legend_active: 'Active requests (accepted / en route / arrived)',
        map_legend_completed: 'Completed requests',
        profession_paramedic: 'Paramedic',
        profession_mechanic: 'Mechanic',
        profession_plumber: 'Plumber',
        profession_electrician: 'Electrician',
        profession_locksmith: 'Locksmith',
        profession_heating_technician: 'Heating Technician',
        profession_veterinarian: 'Veterinarian',
        overview_title: 'Fast, Local, Volunteer Help',
        overview_text: 'FastAid connects people in urgent need with qualified professionals within 2 km across Montreal.',
        feature_realtime: 'Real-time nearby notifications',
        feature_categories: 'Medical, vehicle, home, and pet emergencies',
        feature_volunteer: 'Volunteer-based community platform'
    },
    fr: {
        app_name: 'FastAid',
        tagline: 'Aide urgente, professionnels à proximité',
        login: 'Connexion',
        username: "Nom d'utilisateur",
        password: 'Mot de passe',
        login_btn: 'Se connecter',
        invalid_username: "Nom d'utilisateur invalide",
        invalid_password: 'Mot de passe invalide',
        login_failed: 'Échec de la connexion. Veuillez réessayer.',
        footer: 'Créé avec soin par Alexandre Nasrallah',
        nav_dashboard: 'Tableau de bord',
        nav_history: 'Historique',
        nav_provide_help: 'Offrir de l\'aide',
        nav_request_help: 'Demander de l\'aide',
        nav_admin: 'Administration',
        lang_en: 'EN',
        lang_fr: 'FR',
        welcome_requester: 'Bienvenue',
        welcome_helper: 'Bienvenue',
        request_help: 'Demander de l\'aide',
        request_help_now: 'Demander de l\'aide maintenant',
        select_category: 'Sélectionnez une catégorie d\'urgence',
        select_subtype: 'Sélectionnez le type d\'urgence',
        confirm_location: 'Confirmez votre emplacement sur la carte, puis soumettez votre demande.',
        cat_medical: 'Urgence médicale',
        cat_vehicle: 'Urgence véhicule',
        cat_home: 'Urgence domestique',
        cat_pet: 'Urgence animale',
        sub_dead_battery: 'Batterie à plat',
        sub_flat_tire: 'Pneu crevé',
        sub_vehicle_breakdown: 'Panne de véhicule',
        sub_other_mechanical: 'Autre urgence mécanique',
        sub_plumbing: 'Urgence plomberie',
        sub_electrical: 'Urgence électrique',
        sub_locksmith: 'Porte claquée / Sécurité',
        sub_heating: 'Urgence chauffage',
        back: 'Retour',
        change_category: 'Changer de catégorie',
        no_helper_available: 'Aucun professionnel qualifié n\'est disponible dans un rayon de 2 km.',
        active_request_exists: 'Vous avez déjà une demande active.',
        waiting_for_helper: 'En attente qu\'un professionnel à proximité accepte votre demande...',
        helper_en_route: 'est en route.',
        contact_phone: 'Téléphone',
        status_pending: 'En attente',
        status_accepted: 'Acceptée',
        status_en_route: 'En route',
        status_arrived: 'Arrivé',
        status_completed: 'Terminée',
        helper_waiting: 'En attente de demandes correspondantes à proximité...',
        incoming_request: 'Nouvelle demande urgente à proximité',
        accept: 'Accepter',
        accepted: 'Acceptée',
        already_accepted: 'Cette demande a déjà été acceptée par un autre professionnel.',
        update_status: 'Mettre à jour le statut',
        mark_en_route: 'Marquer en route',
        mark_arrived: 'Marquer arrivé',
        mark_completed: 'Marquer terminée',
        active_request: 'Demande active',
        requester: 'Demandeur',
        location: 'Emplacement',
        time: 'Heure',
        category: 'Catégorie',
        problem_type: 'Type de problème',
        status: 'Statut',
        helper: 'Professionnel',
        no_history: 'Aucun historique pour le moment.',
        requester_history_title: 'Votre historique de demandes',
        helper_history_title: 'Votre historique d\'assistance',
        admin_title: 'Administration',
        admin_users: 'Utilisateurs',
        admin_requests: 'Demandes',
        admin_map: 'Carte d\'activité',
        admin_create_user: 'Créer un utilisateur',
        admin_save: 'Enregistrer',
        admin_delete: 'Supprimer',
        admin_edit: 'Modifier',
        admin_display_name: 'Nom affiché',
        admin_phone: 'Téléphone',
        admin_can_request: 'Peut demander',
        admin_can_help: 'Peut aider',
        admin_profession: 'Profession',
        admin_is_admin: 'Administrateur',
        admin_address: 'Adresse',
        admin_lng: 'Longitude',
        admin_lat: 'Latitude',
        admin_username: "Nom d'utilisateur",
        admin_password: 'Mot de passe',
        map_legend_pending: 'Demandes en attente',
        map_legend_active: 'Demandes actives (acceptée / en route / arrivée)',
        map_legend_completed: 'Demandes terminées',
        profession_paramedic: 'Paramédic',
        profession_mechanic: 'Mécanicien',
        profession_plumber: 'Plombier',
        profession_electrician: 'Électricien',
        profession_locksmith: 'Serrurier',
        profession_heating_technician: 'Technicien chauffage',
        profession_veterinarian: 'Vétérinaire',
        overview_title: 'Aide locale, rapide et bénévole',
        overview_text: 'FastAid connecte les personnes en urgence avec des professionnels qualifiés dans un rayon de 2 km à Montréal.',
        feature_realtime: 'Notifications en temps réel à proximité',
        feature_categories: 'Urgences médicales, véhicule, domicile et animaux',
        feature_volunteer: 'Plateforme communautaire bénévole'
    }
};

function getLang() {
    return sessionStorage.getItem('fastaid_lang') || 'en';
}

function setLang(lang) {
    sessionStorage.setItem('fastaid_lang', lang);
}

function t(key) {
    const lang = getLang();
    return translations[lang][key] || translations.en[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    document.documentElement.lang = getLang();
}

function categoryLabel(category) {
    return t('cat_' + category);
}

function subTypeLabel(subType) {
    return t('sub_' + subType);
}

function statusLabel(status) {
    return t('status_' + status);
}

function professionLabel(profession) {
    return t('profession_' + profession);
}

function setupLangSwitcher() {
    const enBtn = document.getElementById('langEn');
    const frBtn = document.getElementById('langFr');
    if (!enBtn || !frBtn) return;

    function refreshActive() {
        enBtn.classList.toggle('active', getLang() === 'en');
        frBtn.classList.toggle('active', getLang() === 'fr');
    }

    enBtn.addEventListener('click', () => {
        setLang('en');
        applyTranslations();
        refreshActive();
        document.dispatchEvent(new Event('languageChanged'));
    });

    frBtn.addEventListener('click', () => {
        setLang('fr');
        applyTranslations();
        refreshActive();
        document.dispatchEvent(new Event('languageChanged'));
    });

    refreshActive();
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    setupLangSwitcher();
});
