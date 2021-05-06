import { View } from 'react-native';
import React from 'react';
import EStyleSheet from 'react-native-extended-stylesheet';

const BottomContainer = (props) => (
  <View style={styles.bottomContainer}>{props.children}</View>
);

const styles = EStyleSheet.create({
  bottomContainer: {
    paddingVertical: '1.5rem',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '3rem',
    paddingHorizontal: '1.5rem'
  },
});

export default BottomContainer;
