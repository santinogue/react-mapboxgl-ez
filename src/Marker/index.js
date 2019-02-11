import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import { Popup } from 'mapbox-gl/dist/mapbox-gl';

import { loadImages } from '../utils/images';

const MARKERS_SOURCE_ID = 'markers-source';
const MARKERS_LAYER_ID = 'markers-layer';

class Marker extends PureComponent {
  constructor (props) {
    super(props);

    this.onMapLoad = this.onMapLoad.bind(this);
    this.addSource = this.addSource.bind(this);
    this.addLayer = this.addLayer.bind(this);
    this.onMapClick = this.onMapClick.bind(this);
    this.onClosePopup = this.onClosePopup.bind(this);
    this.renderPopupMarkup = this.renderPopupMarkup.bind(this);

    this.popupElement = document.createElement('div');
  }

  componentDidMount () {
    const { map } = this.props;

    if (map.loaded()) {
      this.onMapLoad();
    } else {
      map.on('load', this.onMapLoad);
    }

    map.on('click', this.onMapClick);

    window.map = map;
  }

  componentDidUpdate (prevProps) {
    const prevSource = prevProps.source;
    const nextSource = this.props.source;

    if (!isEqual(prevSource, nextSource)) {
      this.addSource();
    }
  }

  componentWillUnmount () {
    const { map } = this.props;
    const markersSource = map.getSource(MARKERS_SOURCE_ID);

    if (map.getLayer(MARKERS_LAYER_ID)) {
      map.removeLayer(MARKERS_LAYER_ID);
    }

    if (markersSource) {
      map.removeSource(MARKERS_SOURCE_ID);
    }

    map.off('click', this.onMapClick);
  }

  onMapLoad () {
    const { map, source } = this.props;
    const images = source.map(e => (e.properties.icon_image));

    this.addSource();
    Promise.all(loadImages(map, images)).then(this.addLayer);
  }

  onMapClick (e) {
    const { map } = this.props;
    const markersClicked = map.queryRenderedFeatures(e.point, { layers: [MARKERS_LAYER_ID] });

    this.onClosePopup();

    if (markersClicked.length > 0) {
      const [markerClicked] = markersClicked;

      this.popup = new Popup({
        closeButton: false,
        closeOnClick: true,
      });

      this.popup.on('close', this.unmountPopupComponent);

      this.popup.setLngLat(e.lngLat)
        .setDOMContent(this.renderPopupMarkup(markerClicked))
        .addTo(map);
    }
  }

  onClosePopup () {
    if (this.popup) {
      this.popup.off('close', this.unmountPopupComponent);
      this.popup.remove();
      this.popup = null;
    }

    ReactDOM.unmountComponentAtNode(this.popupElement);
  }

  addSource () {
    const { map, source } = this.props;
    const markersSource = map.getSource(MARKERS_SOURCE_ID);

    if (markersSource) {
      markersSource.setData({
        'type': 'FeatureCollection',
        'features': source,
      });
    } else {
      map.addSource(
        MARKERS_SOURCE_ID,
        {
          type: 'geojson',
          data: {
            'type': 'FeatureCollection',
            'features': source,
          },
        }
      );
    }
  }

  addLayer () {
    const { map, layout: userLayout, paint: userPaint } = this.props;
    const layout = { 'icon-image': ['get', 'icon_image'], ...userLayout };
    const paint = { ...userPaint };

    if (!map.getLayer(MARKERS_LAYER_ID)) {
      map.addLayer({
        'id': MARKERS_LAYER_ID,
        'type': 'symbol',
        'source': MARKERS_SOURCE_ID,
        layout,
        paint,
      });
    }
  }

  renderPopupMarkup (markerFeature) {
    ReactDOM.render(
      React.Children.map(this.props.children, child =>
        React.cloneElement(child, { feature: markerFeature })
      )[0],
      this.popupElement,
    );

    return this.popupElement;
  }

  render () {
    return null;
  }
}

Marker.propTypes = {
  children: PropTypes.node,
  map: PropTypes.object,
  source: PropTypes.array,
  layout: PropTypes.object,
  paint: PropTypes.object,
  popup: PropTypes.bool,
};

export default Marker;
