const predef = require("./tools/predef");
const meta = require("./tools/meta");
const { ParamType } = meta;
const { px, du, op, min } = require("./tools/graphics");

// Defines a number parameter for configuration
function number(defValue, step, min) {
    return {
        type: ParamType.NUMBER,
        def: defValue,
        restrictions: {
            step: step || 1,
            min: min > 0 ? min : 0
        }
    };
}

class PreviousRTHStats {
    init() {
        // Initialize variables for the previous RTH session statistics
        this.prevRTHHigh = -Infinity;
        this.prevRTHLow = Infinity;
        this.prevRTHClose = undefined;
        this.prevRTHMid = undefined;
        this.pRTHClose15 = undefined;
        this.pRTHClose1515 = undefined;
        this.pRTHClose1559 = undefined;
        this.prevDay = null;
    }

    map(d, i, history) {
        // Extract date and time components from the data point
        const timestamp = d.timestamp();
        const currentDate = timestamp.toISOString().split('T')[0];
        const hour = timestamp.getHours();
        const minute = timestamp.getMinutes();
        const second = timestamp.getSeconds();

        // Update statistics when transitioning to a new day
        if (this.prevDay !== currentDate) {
            this.prevDay = currentDate;
            this.prevRTHHigh = -Infinity;
            this.prevRTHLow = Infinity;
            this.prevRTHClose = undefined;
            this.pRTHClose15 = undefined;
            this.pRTHClose1515 = undefined;
            this.pRTHClose1559 = undefined;
            let prevDayData = null;

            // Scan previous day's data to find high, low, and last close values
            for (let j = i; j >= 0; j--) {
                let pastData = history.get(j);
                if (pastData && pastData.timestamp().toISOString().split('T')[0] !== currentDate) {
                    const pastHour = pastData.timestamp().getHours();
                    const pastMinute = pastData.timestamp().getMinutes();
                    const pastSecond = pastData.timestamp().getSeconds();

                    // Check previous day's RTH session and specific times
                    if (pastHour >= this.props.startHour && pastHour < this.props.endHour) {
                        this.prevRTHHigh = Math.max(this.prevRTHHigh, pastData.high());
                        this.prevRTHLow = Math.min(this.prevRTHLow, pastData.low());
                        prevDayData = pastData; // Save the last past day data point
                    } 

                    // Record opening and closing values at specific times
                    if (pastHour === 14 && pastMinute === 59 && pastSecond === 30) {
                        this.pRTHClose15 = pastData.close();
                    } else if (pastHour === 15 && pastMinute === 14 && pastSecond === 30) {
                        this.pRTHClose1515 = pastData.close();
                    } else if (pastHour === 15 && pastMinute === 59 && pastSecond === 30) {
                        this.pRTHClose1559 = pastData.close();
                    }

                    if (prevDayData && (pastHour < this.props.startHour || pastHour >= this.props.endHour)) {
                        // Save the last close value of the previous day and exit loop
                        this.prevRTHClose = prevDayData.close();
                        break;
                    }
                }
            }
            // Calculate the mid-point of the previous RTH session
            this.prevRTHMid = (this.prevRTHHigh + this.prevRTHLow) / 2;
        }
        // Return the calculated statistics
        return {
            prevRTHHigh: this.prevRTHHigh !== -Infinity ? this.prevRTHHigh : undefined,
            prevRTHLow: this.prevRTHLow !== Infinity ? this.prevRTHLow : undefined,
            prevRTHMid: this.prevRTHMid,
            // add / remove extra data points
            // prevRTHClose: this.prevRTHClose,
            pRTHClose15: this.pRTHClose15,
            pRTHClose1515: this.pRTHClose1515,
            pRTHClose1559: this.pRTHClose1559
        };
    }
}

module.exports = {
    name: "PreviousRTHStats",
    description: "Previous RTH Session High, Low, Mid, Close, and Specific Times",
    calculator: PreviousRTHStats,
    params: {
        startHour: number(8, 1, 0),
        startMinute: number(30, 1, 0),
        endHour: number(16, 1, 0),
        endMinute: number(0, 1, 0)
    },
    plots: {
        prevRTHHigh: { title: "Previous RTH High" },
        prevRTHLow: { title: "Previous RTH Low" },
        prevRTHMid: { title: "Previous RTH Mid" },
        // prevRTHClose: { title: "Previous RTH Close" },
        pRTHClose15: { title: "pRTH Close at 15:00" },
        pRTHClose1515: { title: "pRTH Close at 15:15" },
        pRTHClose1559: { title: "pRTH Close at 15:59:30" }
    },
    schemeStyles: {
        dark: {
            prevRTHHigh: predef.styles.plot("#00FF00"),
            prevRTHLow: predef.styles.plot("#FF0000"),
            prevRTHMid: predef.styles.plot("#0000FF"),
            // prevRTHClose: predef.styles.plot("#FFA500"),
            pRTHClose15: predef.styles.plot("#FFA500"),
            pRTHClose1515: predef.styles.plot("#FFA500"),
            pRTHClose1559: predef.styles.plot("#FFA500")
        }
    }
};