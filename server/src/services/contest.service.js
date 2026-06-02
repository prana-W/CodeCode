export const deltaCalculation = async (contestId) => {
    // Mock function for delta calculation
    console.log(
        `[DeltaCalculation] Starting calculation for contest ${contestId}`
    );
    return new Promise((resolve) =>
        setTimeout(() => {
            console.log(
                `[DeltaCalculation] Finished calculation for contest ${contestId}`
            );
            resolve();
        }, 2000)
    );
};
