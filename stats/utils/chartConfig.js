/**
 * Chart Configuration
 * Contains all ApexCharts configuration options and themes
 */

export function getGraphOptions(labels, data, view) {
    return {
        series: [{
            name: 'Completions',
            data: data
        }],
        chart: {
            type: 'bar',
            height: 350,
            background: 'transparent',
            fontFamily: 'roca, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 300,
                animateGradually: { enabled: false },
                dynamicAnimation: { enabled: true }
            },
            toolbar: { show: false }
        },
        // ... rest of chart configuration from original stats.js ...
    };
}
