// Fixed categories, subtypes, and profession mapping

const CATEGORIES = ['medical', 'vehicle', 'home', 'pet'];

const VEHICLE_SUBTYPES = ['dead_battery', 'flat_tire', 'vehicle_breakdown', 'other_mechanical'];

const HOME_SUBTYPES = ['plumbing', 'electrical', 'locksmith', 'heating'];

const PROFESSIONS = [
    'paramedic',
    'mechanic',
    'plumber',
    'electrician',
    'locksmith',
    'heating_technician',
    'veterinarian'
];

const STATUSES = ['pending', 'accepted', 'en_route', 'arrived', 'completed'];

const ACTIVE_REQUESTER_STATUSES = ['pending', 'accepted', 'en_route', 'arrived'];

const ACTIVE_HELPER_STATUSES = ['accepted', 'en_route', 'arrived'];

function getRequiredProfession(category, subType) {
    if (category === 'medical') return 'paramedic';
    if (category === 'vehicle') return 'mechanic';
    if (category === 'pet') return 'veterinarian';
    if (category === 'home') {
        const map = {
            plumbing: 'plumber',
            electrical: 'electrician',
            locksmith: 'locksmith',
            heating: 'heating_technician'
        };
        return map[subType] || null;
    }
    return null;
}

module.exports = {
    CATEGORIES,
    VEHICLE_SUBTYPES,
    HOME_SUBTYPES,
    PROFESSIONS,
    STATUSES,
    ACTIVE_REQUESTER_STATUSES,
    ACTIVE_HELPER_STATUSES,
    getRequiredProfession
};
