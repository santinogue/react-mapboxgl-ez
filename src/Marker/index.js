import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { loadImages } from '../utils/images';

const MARKERS_SOURCE_ID = 'markers-source';
const MARKERS_LAYER_ID = 'markers-layer';

class Marker extends PureComponent {
  constructor (props) {
    super(props);

    this.onMapLoad = this.onMapLoad.bind(this);
    this.addSource = this.addSource.bind(this);
    this.addLayer = this.addLayer.bind(this);
  }

  componentDidMount () {
    const { map } = this.props;

    if (map.loaded()) {
      this.onMapLoad();
    } else {
      map.on('load', this.onMapLoad);
    }
  }

  componentDidUpdate () {
  }

  componentWillUnmount () {
    const { map, source } = this.props;
    const markersSource = map.getSource(MARKERS_SOURCE_ID);

    if (markersSource) {
      const { data: { features } } = markersSource.serialize();
      const nextFeatures = features.filter(f => f.properties.id !== source.properties.id);

      markersSource.setData({
        'type': 'FeatureCollection',
        'features': nextFeatures,
      });
    }
  }

  onMapLoad () {
    const { map, source } = this.props;
    const image = source.properties.icon_image;

    this.addSource();
    Promise.all(loadImages(map, [image])).then(this.addLayer);
  }

  addSource () {
    const { map, source } = this.props;
    const markersSource = map.getSource(MARKERS_SOURCE_ID);

    if (markersSource) {
      const { data: { features } } = markersSource.serialize();
      markersSource.setData({
        'type': 'FeatureCollection',
        'features': features.concat(source),
      });
    } else {
      map.addSource(
        MARKERS_SOURCE_ID,
        {
          type: 'geojson',
          data: {
            'type': 'FeatureCollection',
            'features': [source],
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

  render () {
    return null;
  }
}

Marker.propTypes = {
  map: PropTypes.object,
  source: PropTypes.object,
  layout: PropTypes.object,
  paint: PropTypes.paint,
};

export default Marker;
