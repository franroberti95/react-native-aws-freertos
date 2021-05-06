import React, {useState} from 'react';
import {ActivityIndicator, Text, TextInput, View} from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import CustomTouchable from '../CustomTouchable';
const EyeActive = () => <Text>show</Text>;
const EyeInactive = () => <Text>hide</Text>;

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
  iconStyles: any;
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
                 iconStyles,
               }: InputInterface) => {
  const [visibilityOn, setVisibilityOn] = useState(false);
  const [isFocused, setIsFocused] = useState(!!autoFocus);
  const eyeIconSize = EStyleSheet.value('1.5rem');

  const handleFocus = () => {
    onFocus && onFocus();
    setIsFocused(true);
  };
  const handleBlur = () => {
    onBlur && onBlur();
    setIsFocused(false);
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text onPress={handleFocus} style={[styles.labelStyle, labelStyle, loading ? styles.disabledColor: {}]}>
          {label}
        </Text>
        {loading && <ActivityIndicator color={EStyleSheet.value("$offWhite")}/>}
      </View>
      <View style={[styles.textContainer, isFocused?styles.focused:{}]}>
        <TextInput
          editable={!loading}
          style={[styles.input, inputStyles, loading ? styles.disabledColor: {}]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          secureTextEntry={visibilityOn}
        />
        <CustomTouchable
          style={[styles.rightIconContainer, iconStyles]}
          onPress={
            toggleVisibility ? () => setVisibilityOn(!visibilityOn) : null
          }>
          {toggleVisibility ? (
            visibilityOn ? (
              <EyeActive
                width={eyeIconSize}
                height={eyeIconSize}
                fill={loading? "grey":EStyleSheet.value('$offWhite')}
              />
            ) : (
              <EyeInactive
                width={eyeIconSize}
                height={eyeIconSize}
                fill={loading? "grey":EStyleSheet.value('$offWhite')}
              />
            )
          ) : (
            rightIcon
          )}
        </CustomTouchable>
      </View>
      {caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
};

const styles = EStyleSheet.create({
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  disabledColor: {
    color: 'grey',
    borderColor: 'grey'
  },
  input: {
    borderBottomWidth: 1,
    borderColor: 'black',
    color: 'black',
    paddingVertical: 5,
    fontSize: '1rem',
  },
  textContainer: {
    borderWidth: 4,
    borderBottomWidth: 4,
    borderRadius: 4,
    borderColor: 'rgba(255,255,255,0.0)'
  },
  focused: {
    borderColor: 'rgba(255,255,255,0.4)'
  },
  labelStyle: {
    color: 'black',
    paddingRight: 5,
  },
  labelContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: '1.5rem',
    marginLeft: 4
  },
  rightIconContainer: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: [{translateY: -(EStyleSheet.value('1.5rem') / 2)}],
  },
  caption: {
    fontSize: '0.875rem',
    color: 'black',
    marginTop: '0.25rem',
  },
});

export default Input;
