import { TypedUseSelectorHook, useDispatch as _useDispatch, useSelector as _useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export let useDispatch = () => _useDispatch<AppDispatch>()
export let useSelector: TypedUseSelectorHook<RootState> = _useSelector
