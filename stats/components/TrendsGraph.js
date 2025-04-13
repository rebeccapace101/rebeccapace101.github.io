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
                name: 'Habit Value',
                data: data // Show actual values instead of just completed status
            }],
            chart: {
                type: 'bar',
                height: 350,
                background: 'transparent',
                fontFamily: 'Inter, sans-serif',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 300,
                    animateGradually: { enabled: false },
                    dynamicAnimation: { enabled: true }
                },
                toolbar: { show: false }
            },
            xaxis: {
                categories: labels
            },
            yaxis: {
                title: {
                    text: 'Habit Value'
                }
            },
            tooltip: {
                y: {
                    formatter: (value) => value > 0 ? value : 'No Data'
                }
            },
            colors: ['#606C38']
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
