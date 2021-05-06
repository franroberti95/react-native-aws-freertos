import React from "react"
import {Text, TouchableOpacity, View, ActivityIndicator} from "react-native";
import EStyleSheet from "react-native-extended-stylesheet";

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

const OutlinedButton = ({onPress, icon, text, textStyles = {color: "#F6F6F5"}, color = "$grey", loading, containerStyles}:OutlinedButtonProps) => {
  const backgroundIsCssVar = color && color[0] === "$";
  let backgroundColor = color;

  if(backgroundIsCssVar)
    backgroundColor = EStyleSheet.value(color);

  return <TouchableOpacity
    onPress={onPress}
  >
    <View style={[styles.buttonContainer,containerStyles||{}, {backgroundColor}]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      {
        typeof text === "string" ?
          <Text numberOfLines={1} style={[styles.buttonTextStyle, textStyles]}>
            {text}
          </Text> :
          text
      }
      {loading && <ActivityIndicator style={styles.activityIndicator}/>}
    </View>
  </TouchableOpacity>
}
const styles = EStyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingVertical: '0.875rem',
    borderRadius: 12,
    width: '100%'
  },
  buttonTextStyle: {
    fontSize: "1rem",
    fontWeight: "bold",
    textAlign: "center",
    position: 'relative'
  },
  activityIndicator: {
    width: "1rem",
    height: "1rem",
    position: 'absolute',
    right: '1rem',
    top: '1rem'
  },
  iconContainer: {
    marginRight: "0.6rem"
  }
});

export default OutlinedButton
