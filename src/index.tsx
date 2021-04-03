import { NativeModules } from 'react-native';

type AwsFreertosType = {
  multiply(a: number, b: number): Promise<number>;
};

const { AwsFreertos } = NativeModules;

export default AwsFreertos as AwsFreertosType;
