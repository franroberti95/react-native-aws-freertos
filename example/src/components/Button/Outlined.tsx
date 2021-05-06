import React from 'react';
import {Text, View, ActivityIndicator} from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import CustomTouchable from '../CustomTouchable';

interface OutlinedButtonProps {
  onPress: (e?: React.SyntheticEvent) => void;
  icon?: React.ComponentElement<any, any>;
  text: any;
  textStyles?: object;
  color?: string;
  containerStyles?: object;
  loading?: boolean;
  disabled?: boolean;
}

const OutlinedButton = ({
  disabled,
  onPress,
  icon,
  text,
  textStyles,
  color,
  loading,
  containerStyles
}: OutlinedButtonProps) => {
  const borderIsCssVar = color && color[0] === '$';
  let borderColor = color;

  if (borderIsCssVar) {
    borderColor = EStyleSheet.value(color);
  }

  if (disabled) {
    borderColor = 'lightgrey';
  }

  return (
    <CustomTouchable onPress={!disabled && onPress}>
      <View
        style={[styles.buttonContainer, containerStyles || {}, {borderColor}]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        {typeof text === 'string' ? (
          <Text
            numberOfLines={1}
            style={[styles.buttonTextStyle, textStyles, {color: borderColor}]}>
            {text}
          </Text>
        ) : (
          text
        )}
        {loading && <ActivityIndicator style={styles.activityIndicator} />}
      </View>
    </CustomTouchable>
  );
};
const styles = EStyleSheet.create({
  iconContainer: {
    width: '1rem',
    height: '1rem',
    marginRight: '1rem'
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: '0.51rem',
    borderRadius: 12,
    borderWidth: 2,
    width: '100%',
  },
  buttonTextStyle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    textAlign: 'center',
    // width: '100%',
    position: 'relative',
  },
  activityIndicator: {
    width: '1rem',
    height: '1rem',
    position: 'absolute',
    right: '1rem',
    top: '1rem',
  },
});

export default OutlinedButton;
