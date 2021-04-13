import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import CustomTouchable from '../CustomTouchable';

const EyeActive = () => (
  <Text>0</Text>
);

const EyeInactive = () => (
  <Text>1</Text>
);

interface InputInterface {
  loading?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  label: string;
  autoFocus?: boolean;
  rightIcon?: any;
  labelStyle?: any;
  inputStyles?: any;
  toggleVisibility?: boolean;
  caption?: string;
}

const Input = ({
  loading,
  value,
  onChangeText,
  autoFocus,
  onFocus,
  onBlur,
  label,
  rightIcon,
  labelStyle,
  inputStyles,
  toggleVisibility,
  caption,
}: InputInterface) => {
  const [visibilityOn, setVisibilityOn] = useState(false);

  const eyeIconSize = 24;
  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text onPress={onFocus} style={[styles.labelStyle, labelStyle]}>
          {label}
        </Text>
        {loading && <ActivityIndicator />}
      </View>
      <TextInput
        style={[styles.input, inputStyles]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        secureTextEntry={visibilityOn}
      />
      {caption && <Text style={styles.caption}>{caption}</Text>}
      <CustomTouchable
        style={styles.rightIconContainer}
        onPress={toggleVisibility ? () => setVisibilityOn(!visibilityOn) : null}
      >
        {toggleVisibility ? (
          visibilityOn ? (
            <EyeActive
              width={eyeIconSize}
              height={eyeIconSize}
              fill={'white'}
            />
          ) : (
            <EyeInactive
              width={eyeIconSize}
              height={eyeIconSize}
              fill={'black'}
            />
          )
        ) : (
          rightIcon
        )}
      </CustomTouchable>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: 'black',
    color: 'black',
    paddingVertical: 5,
    fontSize: 16,
  },
  labelStyle: {
    color: 'black',
    paddingRight: 5,
  },
  labelContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -(14 / 2) }],
  },
  caption: {
    fontSize: 14,
    color: 'black',
    marginTop: 4,
  },
});
export default Input;
