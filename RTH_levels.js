const predef = require("./tools/predef");
const meta = require("./tools/meta");
const { ParamType } = meta;
const { px, du, op, min } = require("./tools/graphics");

// Define a function for number parameter setup with default value, step, and minimum value
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

// Initialize variables to track the Regular Trading Hours (RTH) session's stats
class RTHStats {
    init() {
        this.isRTH = false;
        this.rthHigh = -Infinity;
        this.rthLow = Infinity;
        this.rthOpen = -Infinity;
    }

    map(d, i, history) {
        const timestamp = d.timestamp();
        const hour = timestamp.getHours();
        const minute = timestamp.getMinutes();
        const second = timestamp.getSeconds();

        const high = d.high();
        const low = d.low();
        const open = d.open();

        // Check RTH time range and update high, low, and open values accordingly
        if (hour >= this.props.startHour && hour < this.props.endHour) {
            if (!this.isRTH || (hour === this.props.startHour && minute === this.props.startMinute && second === 0)) {
                this.isRTH = true;
                this.rthHigh = high;
                this.rthLow = low;
                this.rthOpen = open;
            } else {
                this.rthHigh = Math.max(this.rthHigh, high);
                this.rthLow = Math.min(this.rthLow, low);
            }
        } else if (this.isRTH && (hour >= this.props.endHour || hour < this.props.startHour)) {
            this.isRTH = false;
        }

        // Calculate mid price of RTH session
        const rthMid = (this.rthHigh + this.rthLow) / 2;

        // Return RTH session statistics including high, low, mid, and open prices
        return {
            rthHigh: this.isRTH ? this.rthHigh : undefined,
            rthLow: this.isRTH ? this.rthLow : undefined,
            rthMid: this.isRTH ? rthMid : undefined,
            rthOpen: this.isRTH ? this.rthOpen : undefined
        };
    }
}

// Module exports with indicator name, description, and configuration parameters
module.exports = {
    name: "RTHStats",
    description: "RTH Session High, Low, and Mid",
    calculator: RTHStats,
    // Define indicator parameters for start and end times of the RTH session
    params: {
        startHour: number(8, 1, 0),
        startMinute: number(30, 1, 0),
        endHour: number(16, 1, 0),
        endMinute: number(0, 1, 0)
    },
    // Configure plots for RTH session statistics to be displayed on the chart
    plots: {
        rthHigh: { title: "RTH High" },
        rthLow: { title: "RTH Low" },
        rthMid: { title: "RTH Mid" },
        rthOpen: { title: "RTH Open" }
    },
    // Set up scheme styles for plotting RTH statistics on dark theme
    schemeStyles: {
        dark: {
            rthHigh: predef.styles.plot("#00FF00"),
            rthLow: predef.styles.plot("#FF0000"),
            rthMid: predef.styles.plot("#0000FF"),
            rthOpen: predef.styles.plot("#FFA500")
        }
    }
};