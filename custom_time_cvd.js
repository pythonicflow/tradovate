const predef = require("./tools/predef");
const meta = require("./tools/meta");

// Define a function for number parameter setup with default value, step, and minimum value
function number(defValue, step, min) {
    return {
        type: meta.ParamType.NUMBER,
        def: defValue,
        restrictions: {
            step: step || 1,
            min: min > 0 ? min : 0
        }
    };
}

// Initialize variables to track the Cumulative Delta (CVD) session's stats
class cumulativeDelta {
    init() {
        this.last = 0;
        this.tradeDate = 0;
    }

    // Calculate the cumulative delta for the current session
    map(d, i, history) {
        const strongUpDown = this.props.strongUpDown;
        const delta = d.offerVolume() - d.bidVolume();
        const open = this.last;
        const close = open + delta;
        const prevd = i > 0 ? history.prior() : d;

        // Extract date and time components from the data point
        const timestamp = d.timestamp();
        const hour = timestamp.getHours();
        const minute = timestamp.getMinutes();
        const startHour = this.props.startHour;
        const startMinute = this.props.startMinute;
        const endHour = this.props.endHour;
        const endMinute = this.props.endMinute;

        const sessionStart = new Date(timestamp);
        sessionStart.setHours(startHour, startMinute, 0, 0);

        const sessionEnd = new Date(timestamp);
        sessionEnd.setHours(endHour, endMinute, 0, 0);

        if (timestamp < sessionStart || timestamp >= sessionEnd) {
            return {
                open: this.last,
                close: this.last,
                delta: 0,
                value: 0
            };
        }

        // Check if the current bar is strong up or down
        const ud = (strong) => {
            if (strong) {
                return {
                    up: d.close() > prevd.high(),
                    down: d.close() < prevd.low()
                };
            }
            return {
                up: d.close() > d.open(),
                down: d.close() < d.open()
            };
        };

        const colorUD = ud(strongUpDown);
        let result = {
            open,
            close,
            delta,
            value: Math.abs(delta)
        };

        if (colorUD.down) {
            result.down_open = open;
            result.down_close = close;
            result.color = "red"; 
        } else if (colorUD.up) {
            result.up_open = open;
            result.up_close = close;
            result.color = "deepskyblue"; 
        } else {
            result.neutral_open = open;
            result.neutral_close = close;
            result.color = "gray"; 
        }

        this.last = close;
        return result;
    }
}

module.exports = {
    name: "customCVD",
    title: /*i18n*/ "customCVD  Session",
    description: /*i18n*/ "customCVD  with Session Time Control",
    calculator: cumulativeDelta,
    params: {
        strongUpDown: predef.paramSpecs.bool(true),
        startHour: number(8, 1, 0),
        startMinute: number(30, 1, 0),
        endHour: number(16, 1, 0),
        endMinute: number(0, 1, 0)
    },
    inputType: meta.InputType.BARS,
    areaChoice: meta.AreaChoice.NEW,
    scaler: predef.scalers.multiPath(["open", "close"]),
    plotter: predef.plotters.cumulative,
    plots: {
        delta: "Delta"
    },
    tags: [predef.tags.Volumes],
    schemeStyles: predef.styles.solidLine("delta", {
        color: "#7e838c",
        lineWidth: 3
    })
};