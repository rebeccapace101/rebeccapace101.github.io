/**
 * Trends Graph Component
 * Handles rendering of the trends graph using ApexCharts.
 */

class TrendsGraph {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
    }

    /**
     * Renders the trends graph with the provided data.
     * @param {Array<string>} labels - The labels for the x-axis.
     * @param {Array<number>} data - The data points for the graph.
     * @param {string} view - The current view (e.g., day, week, month).
     */
    render(labels, data, view) {
        if (!this.container) {
            console.error('TrendsGraph container not found');
            return;
        }

        if (!window.ApexCharts) {
            console.error('ApexCharts library is not loaded');
            this.container.innerHTML = 'Error: Chart library not loaded';
            return;
        }

        if (!labels.length || !data.length) {
            this.container.innerHTML = "No data available for the selected habit.";
            return;
        }

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

    /**
     * Destroys the current chart instance.
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

export default TrendsGraph;
