export interface GeneralDataProps {
  key: string;
  bucket?: string;
}

export interface SetDataProps<T> {
  key: string;
  value: T;
  bucket?: string;
  expires_in?: number;
}

export interface GetDataProps extends GeneralDataProps {}

export interface DeleteDateProps extends GeneralDataProps {}
