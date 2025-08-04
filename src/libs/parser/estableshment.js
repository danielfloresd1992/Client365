export function groupByFranchiseComprehensive(restaurantsArray) {
    return restaurantsArray.reduce((grouped, restaurant) => {
        // Use name_franchise as primary key, fallback to franchise if not available
        const key = restaurant.franchiseReference?.name_franchise || restaurant.franchise;

        if (!grouped[key]) {
            grouped[key] = [];
        }

        grouped[key].push(restaurant);
        return grouped;
    }, {});
}