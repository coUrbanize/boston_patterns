
function makeChart(chartLocation, option){

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 400 - margin.left - margin.right,
        height = 230 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], 0.1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "Neighborhood");

    var svg = d3.select(chartLocation)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv("data/boston.tsv", function(error, data) {
      x.domain(data.map(function(d) { return d.neighborhood; }));
      if(option=='Height'){
        y.domain([0, d3.max(data, function(d) { return d.building_height; })]);
      }
      else if(option=='Density'){
        y.domain([0, 40000]); // harcoding this value for now
      }

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
          .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.9em")
            .attr("dy", "-.6em")
            .attr("transform", function(d) {
                return "rotate(-90)";
                });

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text(option);

      svg.selectAll(".bar")
          .data(data)
        .enter().append("rect")
          .attr("class", function(d) { return "bar " + d.neighborhood.replace(/\s/g, ''); })
          .attr("x", function(d) { return x(d.neighborhood); })
          .attr("width", x.rangeBand())
          .attr("y", function(d) {
            if(option=='Height'){
              return y(d.building_height);
            }
            else if(option=='Density'){
              return y(d.density);
            }
          })
          .attr("height", function(d) {
            if(option=='Height'){
              return height - y(d.building_height);
            }
            else if(option=='Density'){
              return height - y(d.density);
            }
          })
          .on("mouseover", onBarHoverOver)
          .on("mouseout", onBarHoverOut);
    });

}

function onBarHoverOver(d){
  var nbhd = this.classList[1].replace(/\s/g, '');
  var layers = mapLayers['_layers'];  // get polygons (dictionary object)

  for (var key in layers) {
    var layer = layers[key];
    var layerName = layer['feature']['properties']['nbhd'].replace(/\s/g, '');
    if(nbhd == layerName){
      layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
      });
      // make sure highlighted polygon comes to front
      if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
      }
      // update info box
      info.update(layer.feature.properties);
    }
  }

}

function onBarHoverOut(d){
  var nbhd = this.classList[1].replace(/\s/g, '');
  var layers = mapLayers['_layers'];  // get polygons (dictionary object)

  for (var key in layers) {
    var layer = layers[key];
    var layerName = layer['feature']['properties']['nbhd'].replace(/\s/g, '');
    if(nbhd == layerName){
      layer.setStyle({
        weight: 2,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
      });
    }
  }
}

makeChart("#chart_density", 'Density');
makeChart("#chart_height", 'Height');

