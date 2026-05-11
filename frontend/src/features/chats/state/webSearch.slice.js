import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isSearchingWeb: false,
  sources: [],
};

const webSearchSlice = createSlice({
  name: "webSearch",

  initialState,

  reducers: {

    setSearchingWeb: (state, action) => {
      state.isSearchingWeb = action.payload;
    },

    setSources: (state, action) => {
      state.sources = action.payload;
    },

    clearSources: (state) => {
      state.isSearchingWeb = false;
      state.sources = [];
    },
  },
});

export const {
  setSearchingWeb,
  setSources,
  clearSources,
} = webSearchSlice.actions;

export default webSearchSlice.reducer;