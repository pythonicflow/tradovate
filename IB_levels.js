const predef = require("./tools/predef");
const meta = require("./tools/meta");
const { ParamType } = meta;
const { px, du, op, min } = require("./tools/graphics");
const p = require("./tools/plotting");

// Define a function to create number parameters for the indicator
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

// Initialize variables for tracking the initial balance (IB) session
class ibext {
    init() {
        this.ibEnd = true;
        this.ibHigh = -Infinity;
        this.ibLow = Infinity;
        this.ibStartTimestamp = null;
    }
    // Map function to calculate IB and its extensions based on price data
    map(d, i, history) {
        const currentTimestamp = d.timestamp();
        const currentDate = currentTimestamp.toISOString().split('T')[0];
        const startHour = this.props.startHour;
        const startMinute = this.props.startMinute;
        // Convert minutes to milliseconds for duration calculation
        const duration = this.props.duration * 60000;
        
        const hour = currentTimestamp.getHours();
        const minute = currentTimestamp.getMinutes();
        const second = currentTimestamp.getSeconds();
    
        const high = d.high();
        const low = d.low();
    
        // Determine the start of the IB session
        if (hour === startHour && minute === startMinute && second === 0 && this.ibEnd) {
            this.ibStartTimestamp = currentTimestamp;
            this.ibHigh = high;
            this.ibLow = low;
            this.ibEnd = false;
        } else if (this.ibStartTimestamp && !this.ibEnd) {
            // Check bars forming at the end of the IB session
            let ibEndTime = this.ibStartTimestamp.getTime() + duration;
            if (currentTimestamp.getTime() >= ibEndTime) {
                // End the IB session
                this.ibEnd = true;
            } else {
                // Update IB high and low within the IB session
                if (high > this.ibHigh) {
                    this.ibHigh = high;
                }
                if (low < this.ibLow) {
                    this.ibLow = low;
                }
            }
        }
        // Calculate IB range and extensions if IB session has valid high and low values
        if (this.ibHigh !== -Infinity && this.ibStartTimestamp.toISOString().split('T')[0] === currentDate) {
            const range = this.ibHigh - this.ibLow;
            const ext1 = this.ibHigh + (range * this.props.firstExtensionPercentage / 100);
            const ext2 = this.ibHigh + (range * this.props.secondExtensionPercentage / 100);
            const extm1 = this.ibLow - (range * this.props.firstExtensionPercentage / 100);
            const extm2 = this.ibLow - (range * this.props.secondExtensionPercentage / 100);
    
            return {
                ibHigh: this.ibHigh,
                ibLow: this.ibLow,
                ext1: ext1,
                ext2: ext2,
                extm1: extm1,
                extm2: extm2
            };
        }
    
        return {
            ibHigh: undefined,
            ibLow: undefined,
            ext1: undefined,
            ext2: undefined,
            extm1: undefined,
            extm2: undefined
        };
    }
}
// Module exports with indicator specifics
module.exports = {
    name: "ibext",
    description: "IBNEW Initial Balance with Enhanced Time Precision",
    calculator: ibext,
    params: {
        startHour: number(8, 1, 0),
        startMinute: number(30, 1, 0),
        duration: number(60, 0.1, 0.1), // Indicator parameter for IB session duration
        firstExtensionPercentage: number(50, 0.1, 0.1),
        secondExtensionPercentage: number(100, 0.1, 0.1),
        enableExtensions: predef.paramSpecs.bool(true),
        enableLabels: predef.paramSpecs.bool(true)
    },
    plots: {
        ibHigh: { title: "IB High" },
        ibLow: { title: "IB Low" },
        ext1: { title: "Extension 1" },
        ext2: { title: "Extension 2" },
        extm1: { title: "Extension -1" },
        extm2: { title: "Extension -2" }
    },
    schemeStyles: {
        dark: {
            ibHigh: predef.styles.plot("#00FF00"),
            ibLow: predef.styles.plot("#FF0000"),
            ext1: predef.styles.plot("#FFA500"),
            ext2: predef.styles.plot("#FFC0CB"),
            extm1: predef.styles.plot("#1E90FF"),
            extm2: predef.styles.plot("#FFFF00")
        }
    }
};