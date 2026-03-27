(function() {
    const svg = d3.select("#map-svg2"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    const projection = d3.geoNaturalEarth1().scale(160).translate([width / 2, height / 2.2]);
    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleThreshold()
        .domain([0.5, 2, 5, 10, 15, 20])
        .range(d3.schemeYlOrRd[8]);

    Promise.all([
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
        d3.csv("co2_map_per_capita.csv")
    ]).then(function([world, data]) {
        let currentYear = "2022";

        function getCO2PerCapita(iso_code, year) {
            const entry = data.find(d => d.iso_code === iso_code && d.year === year);
            return entry ? +entry.co2_per_capita : 0;
        }

        function drawSparkline(selection, countryIso) {
            const countryHistory = data.filter(d => d.iso_code === countryIso)
                .sort((a, b) => +a.year - +b.year);

            if (countryHistory.length === 0) return;

            const sw = 160, sh = 40;
            const s_svg = selection.append("svg")
                .attr("width", sw)
                .attr("height", sh);

            const x = d3.scaleLinear()
                .domain(d3.extent(countryHistory, d => +d.year))
                .range([0, sw]);

            const y = d3.scaleLinear()
                .domain([0, d3.max(countryHistory, d => +d.co2_per_capita)])
                .range([sh, 2]);

            const line = d3.line()
                .x(d => x(+d.year))
                .y(d => y(+d.co2_per_capita))
                .defined(d => d.co2_per_capita !== 0);

            s_svg.append("path")
                .datum(countryHistory)
                .attr("class", "sparkline-path")
                .attr("d", line);

            selection.append("div")
                .attr("class", "spark-years")
                .html(`<span>1950</span><span>2022</span>`);
        }

        const mapGroup = svg.append("g");

        mapGroup.selectAll("path")
            .data(world.features)
            .join("path")
            .attr("class", "country")
            .attr("d", path)
            .style("fill", d => {
                const val = getCO2PerCapita(d.id, currentYear);
                return val > 0 ? colorScale(val) : "#eee";
            })
            .on("mouseover", function(event, d) {
                const val = getCO2PerCapita(d.id, currentYear);
                const tooltip = d3.select("#tooltip");

                tooltip.style("opacity", 1).html("");

                tooltip.append("div")
                    .style("font-weight", "bold")
                    .text(d.properties.name);

                tooltip.append("div")
                    .style("margin-bottom", "8px")
                    .text(`${val ? val.toFixed(2) : 0} tonnes per capita (${currentYear})`);

                const sparkContainer = tooltip.append("div")
                    .attr("class", "sparkline-container");

                drawSparkline(sparkContainer, d.id);
            })
            .on("mousemove", (event) => {
                d3.select("#tooltip")
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseleave", () => d3.select("#tooltip").style("opacity", 0));

        d3.select("#yearSlider2").on("input", function() {
            currentYear = this.value;
            d3.select("#yearLabel2").text(currentYear);
            mapGroup.selectAll(".country").transition().duration(100)
                .style("fill", d => {
                    const val = getCO2PerCapita(d.id, currentYear);
                    return val > 0 ? colorScale(val) : "#eee";
                });
        });
    });
})();