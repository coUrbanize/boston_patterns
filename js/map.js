var geojson, mapLayers;

var map = L.map('map').setView([42.32, -71.07], 12);

		// create the Esri Gray layer
		var grayMapUrl = 'http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
		var grayMapLayer = new L.TileLayer(grayMapUrl, { maxZoom: 19, attribution: 'Tiles: &copy; Esri' });
		map.addLayer(grayMapLayer);

		// control that shows state info on hover
		var info = L.control();

		info.onAdd = function (map) {
			this._div = L.DomUtil.create('div', 'info');
			this.update();
			return this._div;
		};

		info.update = function (props) {
			this._div.innerHTML = '<h4>Boston Neighborhoods</h4>' +  (props ?
				'<b>' + props.nbhd + '</b><br />' 
				+ 'Density: ' + props.pop_den_avg.toFixed(0) + ' people per square mile<br>'
				+ 'Avg. Building Height: ' + props.top_gl_avg.toFixed(1) + ' feet'
				: 'Hover over a neighborhood');
		};

		info.addTo(map);

		// get color depending on population density value
		function getColorPop(d) {

			return 	d > 35000 ? '#990000' :
				d > 30000 ? '#d7301f' :
				d > 25000 ? '#ef6548' :
				d > 20000 ? '#fc8d59' :
				d > 15000 ? '#fdbb84' :
				d > 10000 ? '#fdd49e' :
				d > 5000 ? '#fee8c8' :
				d > 0 ?  '#fff7ec' :
						 '#FFEDA0';
		}

		function getColorHeight(d) {

			return 	d > 70 ? '#990000' :
				d > 60 ? '#d7301f' :
				d > 50 ? '#ef6548' :
				d > 40 ? '#fc8d59' :
				d > 30 ? '#fdbb84' :
				d > 20 ? '#fdd49e' :
				d > 10 ? '#fee8c8' :
				d > 0 ?  '#fff7ec' :
						 '#FFEDA0';
		}

		function stylePop(feature) {
			return {
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.7,
				fillColor: getColorPop(feature.properties.pop_den_avg)
			};
		}

		function styleHeight(feature) {
			return {
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.7,
				fillColor: getColorHeight(feature.properties.top_gl_avg)
			};
		}


		function highlightFeature(e) {
			var layer = e.target;

			layer.setStyle({
				weight: 5,
				color: '#666',
				dashArray: '',
				fillOpacity: 0.7
			});

			if (!L.Browser.ie && !L.Browser.opera) {
				layer.bringToFront();
			}

			info.update(layer.feature.properties);

			// select bar on chart
			var nbhd = layer.feature.properties.nbhd.replace(/\s/g, '');
			d3.selectAll('.' + nbhd).attr('opacity', 0.4);
		}


		function resetHighlight(e) {
			var layer = e.target;
			mapLayers.resetStyle(e.target);
			info.update();

			// reset change on bar charts
			var nbhd = layer.feature.properties.nbhd.replace(/\s/g, '');
			d3.selectAll('.bar').attr('opacity', 1);
		}

		function zoomToFeature(e) {
			map.fitBounds(e.target.getBounds());
		}

		function onEachFeature(feature, layer) {
			layer.on({
				mouseover: highlightFeature,
				mouseout: resetHighlight,
				click: zoomToFeature
			});
		}

		function makePop(){

			if(mapLayers){
				mapLayers.clearLayers();
				heightlegend.removeFrom(map);
			}
			poplegend.addTo(map);
			mapLayers = []
			mapLayers = L.geoJson(bostonData, {
				style: stylePop,
				onEachFeature: onEachFeature
			})
			map.addLayer(mapLayers)

		}

		function makeHeight(){
			poplegend.removeFrom(map);
			heightlegend.addTo(map);

			mapLayers.clearLayers();
			mapLayers = []
			mapLayers = L.geoJson(bostonData, {
				style: styleHeight,
				onEachFeature: onEachFeature
			}).addTo(map);
			map.addLayer(mapLayers)
		}

		map.attributionControl.addAttribution('Population data: <a href="http://census.gov/">US Census Bureau</a> | Building Data: <a href="http://data.boston.gov/">City of Boston</a>');

		var controllegend = L.control({position: 'bottomright'});
		controllegend.onAdd = function (map) {

			var div = L.DomUtil.create('div', 'info legend controls');
			div.innerHTML = 'Layer<br/>' + '<input class="map-layer" type="radio" name="time" value="pop" checked="true">'
		        + '<div class="controls-text">Population Density</div><br>'
		        + '<input class="map-layer" type="radio" name="time" value="height">'
		        + '<div class="controls-text">Average Building Height</div>';

			return div;
		};

		var poplegend = L.control({position: 'bottomright'});
		poplegend.onAdd = function (map) {

			var div = L.DomUtil.create('div', 'info legend'),
				grades = [0, 5000, 10000, 15000, 20000, 25000, 30000, 35000],
				labels = [],
				from, to;

			for (var i = 0; i < grades.length; i++) {
				from = grades[i];
				to = grades[i + 1];

				labels.push(
					'<i style="background:' + getColorPop(from + 1) + '"></i> ' +
					from + (to ? '&ndash;' + to : '+'));
			}

			div.innerHTML = 'Pop. Density [people/mile<sup>2</sup>]<br>' + labels.join('<br>');
			return div;
		};

		var heightlegend = L.control({position: 'bottomright'});
		heightlegend.onAdd = function (map) {

			var div = L.DomUtil.create('div', 'info legend'),
				grades = [0, 10, 20, 30, 40, 50, 60, 70],
				labels = [],
				from, to;

			for (var i = 0; i < grades.length; i++) {
				from = grades[i];
				to = grades[i + 1];

				labels.push(
					'<i style="background:' + getColorHeight(from + 1) + '"></i> ' +
					from + (to ? '&ndash;' + to : '+'));
			}

			div.innerHTML = 'Height [ft]<br>' + labels.join('<br>');
			return div;
		};



		// add controls and pop layer
		controllegend.addTo(map);
		makePop();

		

		// choose the layer to display
		$(".map-layer").change(function(){
			if( $(this).is(":checked") ){
				if($(this).val() == 'height'){
					makeHeight();
				}
				if($(this).val() == 'pop'){
					makePop();
				}
			}
		});
