(function() {
    const svg = d3.select("#stacked-svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    const margin = {top: 20, right: 150, bottom: 130, left: 60},
        margin2 = {top: 520, right: 150, bottom: 40, left: 60},
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom,
        innerHeight2 = height - margin2.top - margin2.bottom;

    svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight);

    const focus = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const context = svg.append("g")
        .attr("transform", `translate(${margin2.left},${margin2.top})`);

    d3.csv("co2_top10_plus_others_stacked.csv").then(function(data) {
        const keys = ['China', 'United States', 'India', 'Russia', 'Japan', 'Indonesia', 'Iran', 'Saudi Arabia', 'South Korea', 'Germany', 'Other Countries'];

        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeTableau10.concat(["#cccccc"]));

        const stackedData = d3.stack()
            .keys(keys)(data);

        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => +d.year))
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(stackedData, d => d3.max(d, d => d[1]))])
            .range([innerHeight, 0]);

        const x2 = d3.scaleLinear()
            .domain(x.domain())
            .range([0, innerWidth]);

        const y2 = d3.scaleLinear()
            .domain(y.domain())
            .range([innerHeight2, 0]);

        const area = d3.area()
            .x(d => x(+d.data.year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        const area2 = d3.area()
            .x(d => x2(+d.data.year))
            .y0(d => y2(d[0]))
            .y1(d => y2(d[1]));

        const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));

        const focusXAxis = focus.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis);

        focus.append("g")
            .call(d3.axisLeft(y));

        const focusLayers = focus.append("g")
            .attr("clip-path", "url(#clip)")
            .selectAll(".layer")
            .data(stackedData)
            .join("path")
            .attr("class", "layer")
            .attr("d", area)
            .style("fill", d => color(d.key))
            .on("mouseover", function(event, d) {
                const tooltip = d3.select("#tooltip");

                tooltip.style("opacity", 1).html("");

                tooltip.append("div")
                    .style("font-weight", "bold")
                    .text(d.key);
            })
            .on("mousemove", (event) => {
                d3.select("#tooltip")
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => d3.select("#tooltip").style("opacity", 0));

        context.selectAll("path")
            .data(stackedData)
            .join("path")
            .attr("d", area2)
            .style("fill", d => color(d.key));

        context.append("g")
            .attr("transform", `translate(0,${innerHeight2})`)
            .call(d3.axisBottom(x2).tickFormat(d3.format("d")));

        const brush = d3.brushX()
            .extent([[0, 0], [innerWidth, innerHeight2]])
            .on("brush end", (event) => {
                const s = event.selection || x2.range();
                x.domain(s.map(x2.invert, x2));
                focusLayers.attr("d", area);
                focusXAxis.call(xAxis);
            });

        const gBrush = context.append("g")
            .attr("class", "brush")
            .call(brush);

        svg.on("dblclick", () => gBrush.call(brush.move, null));

        const legend = svg.append("g")
            .attr("transform", `translate(${width - 130}, ${margin.top})`)
            .selectAll("g")
            .data(keys.slice().reverse())
            .join("g")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legend.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color);

        legend.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "12px")
            .text(d => d);
    });
})();