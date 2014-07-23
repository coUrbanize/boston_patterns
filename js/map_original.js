var geojson, map_layers=[];

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
				+ props.pop_den_avg.toFixed(0) + ' people / mi<sup>2</sup><br>'
				+ props.top_gl_avg.toFixed(1) + ' height ft'
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
			// return d > 40  ? '#E31A1C' :
			//        d > 30  ? '#FC4E2A' :
			//        d > 20  ? '#FD8D3C' :
			//        d > 10  ? '#FEB24C' :
			//        d > 0   ? '#FED976' :
			//                  '#FFEDA0';

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
			// make a popup on hover
			//popup(e)

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

			// select bar
			var nbhd = layer.feature.properties.nbhd.replace(/\s/g, '');
			d3.selectAll('.' + nbhd).attr('opacity', 0.4);
		}


		function resetHighlight(e) {
			var layer = e.target;
			geojson.resetStyle(e.target);
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

			if(geojson){
				geojson.clearLayers();
				heightlegend.removeFrom(map);
			}
			poplegend.addTo(map);
			// $.each(data.results, makeProject);

			geojson = L.geoJson(bostonData, {
				style: stylePop,
				onEachFeature: onEachFeature
			}).addTo(map);

			// map_layers[id] = geojson;
		}

		function makeHeight(){
			poplegend.removeFrom(map);
			heightlegend.addTo(map);

			geojson.clearLayers();
			geojson = L.geoJson(bostonData, {
				style: styleHeight,
				onEachFeature: onEachFeature
			}).addTo(map);
		}

		map.attributionControl.addAttribution('Population data: <a href="http://census.gov/">US Census Bureau</a> | Building Data: <a href="http://data.boston.gov/">City of Boston</a>');


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

			div.innerHTML = 'Pop. Density [people/sq mile]<br>' + labels.join('<br>');
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

		// add population layer
		// $.each(bostonData, makePop);
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
