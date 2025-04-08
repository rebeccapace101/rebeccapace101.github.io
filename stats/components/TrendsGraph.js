/**
 * Trends Graph Component
 */

class TrendsGraph {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
    }

    render(labels, data, view) {
        if (!this.container || !window.ApexCharts) return;

        const options = {
            series: [{
                name: 'Completions',
                data: data
            }],
            chart: {
                type: 'bar',
                height: 350,
                background: 'transparent',
                fontFamily: 'roca, sans-serif'
            },
            xaxis: {
                categories: labels
            },
            // ...rest of chart options...
        };

        if (this.chart) {
            this.chart.destroy();
        }

        try {
            this.chart = new ApexCharts(this.container, options);
            return this.chart.render();
        } catch (error) {
            console.error('Error rendering chart:', error);
            this.container.innerHTML = 'Error loading chart';
        }
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

export default TrendsGraph;
