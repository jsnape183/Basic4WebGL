import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IPackage {
  id: string;
  name: string;
  version: string;
  isCore: boolean;
  isFirstParty: boolean;
  moduleNames: string[];
}

export interface IPackagesState {
  byId: Record<string, IPackage>;
}

const initialState: IPackagesState = {
  byId: {},
};

const packagesSlice = createSlice({
  name: 'packages',
  initialState,
  reducers: {
    seedPackages: (state, action: PayloadAction<IPackage[]>) => {
      action.payload.forEach((pkg) => {
        const existing = state.byId[pkg.id];
        if (!existing || existing.version !== pkg.version) {
          state.byId[pkg.id] = pkg;
        }
      });
    },
  },
});

export const { seedPackages } = packagesSlice.actions;
export default packagesSlice.reducer;
