import { Text, View } from 'react-native';
import React from 'react';
import EStyleSheet from 'react-native-extended-stylesheet';

const TopContainer = ({ text }: { text: String }) => (
  <View style={styles.topContainer}>
    <Text style={styles.title}>{text}</Text>
  </View>
);

const styles = EStyleSheet.create({
  topContainer: {
    paddingVertical: '1.5rem',
  },
  title: {
    color: 'black',
    fontSize: '1.5rem',
    textAlign: 'center',
  },
});

export default TopContainer;
