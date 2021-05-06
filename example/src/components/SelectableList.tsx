import React, { FunctionComponent, useState } from 'react';
import EStyleSheet from 'react-native-extended-stylesheet';
import { View, Text, TouchableOpacity } from 'react-native';

const CheckIcon = () => <Text>✔</Text>;

export interface OptionInterface {
  value: string | number;
  label: string;
  image?: FunctionComponent;
  title?: string;
  selected?: boolean;
  onPress?: () => void;
  customItemStyles?: object;
}

interface SelectableListInterface {
  options: OptionInterface[];
  value: string | number | null | undefined;
  onChange: (opt: OptionInterface) => void;
  customItemStyles?: string;
}

const SelectableList = ({
  options,
  onChange,
  value,
  customItemStyles,
}: SelectableListInterface) => (
  <View style={styles.listContainer}>
    {options.map((opt, index) => (
      <ListItem
        selected={value === opt.value}
        key={index}
        onPress={() => onChange(opt)}
        customItemStyles={customItemStyles}
        {...opt}
      />
    ))}
  </View>
);

const ListItem = ({
  onPress,
  label,
  image,
  title,
  selected,
  customItemStyles,
}: OptionInterface) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.listItem,
        customItemStyles,
        selected ? styles.selectedItem : {},
      ]}
    >
      <View style={styles.imageContainer}>
        {image && React.createElement(image, { active: selected })}
      </View>
      <View style={styles.listItemTextContainer}>
        {title && <Text style={styles.listItemTitle}>{title}</Text>}
        <Text style={styles.listItemLabel}>{label}</Text>
      </View>
      <View
        style={[
          styles.checkContainer,
          selected ? styles.selectedCheckContainer : {},
        ]}
      >
        {selected && (
          <CheckIcon
            height={EStyleSheet.value('1rem')}
            width={EStyleSheet.value('1rem')}
            fill={'white'}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = EStyleSheet.create({
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  selectedItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  listItem: {
    display: 'flex',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: 'black',
    borderStyle: 'solid',
    paddingHorizontal: '1.56rem',
    alignItems: 'center',
    paddingVertical: '1rem',
  },
  listItemTextContainer: {
    flexGrow: 1,
  },
  listItemLabel: {
    color: 'black',
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  listItemTitle: {
    color: 'black',
    fontSize: '1rem',
  },
  checkContainer: {
    borderColor: 'black',
    borderWidth: 2,
    height: '1.375rem',
    width: '1.375rem',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '0.7rem',
  },
  selectedCheckContainer: {
    borderColor: 'black',
  },
  check: {},
  imageContainer: {
    minWidth: '4.375rem',
  },
});

export default SelectableList;
