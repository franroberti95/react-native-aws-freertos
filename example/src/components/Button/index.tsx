import React from 'react';
import ContainedButton from './Contained';
import OutlinedButton from './Outlined';

interface ButtonProps {
  onPress: (e?: React.SyntheticEvent) => void;
  icon?: React.ComponentElement<any, any>;
  text: string | any;
  textStyles?: object;
  variant?: 'outlined' | 'contained';
  color?: string;
  containerStyles?: object;
  loading?: boolean;
  disabled?: boolean;
}

const Button = (props: ButtonProps) => {
  switch (props.variant) {
    case 'outlined':
      return <OutlinedButton {...props} />;
    case 'contained':
    default:
      return <ContainedButton {...props} />;
  }
};

export default Button;
