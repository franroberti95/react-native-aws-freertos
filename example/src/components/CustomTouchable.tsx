import React from 'react';
import {TouchableOpacity, View} from 'react-native';

const CustomTouchable = (props: any) =>
  props.onPress ? (
    <TouchableOpacity {...props}>{props.children}</TouchableOpacity>
  ) : (
    <View {...props}>{props.children}</View>
  );

export default CustomTouchable;
