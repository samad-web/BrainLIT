// Choose the store implementation with one env flag.
//   VITE_STORE=local     → localStore (default, no setup)
//   VITE_STORE=supabase  → supabaseStore (cross-device, admin sees remote kids)
//
// Code everywhere imports { store } from here and never touches an
// implementation directly.
// Interface (both implementations satisfy this):
//   identity:  getStudent, updateStudent
//   auth:      createStudent(classCode, {firstName, username, password, mascotId})  [teacher]
//              loginStudent(username, password)                                     [student]
//   attempts:  saveAttempt, listAttempts
//   admin:     verifyTeacher, listStudents, createClass, classExists, getClass, removeStudent
//   local helpers: saveIdentity, getIdentity, clearIdentity
import { localStore } from './localStore.js'
import { supabaseStore } from './supabaseStore.js'

const impl = import.meta.env.VITE_STORE === 'supabase' ? supabaseStore : localStore

export const store = impl
export const STORE_KIND = import.meta.env.VITE_STORE === 'supabase' ? 'supabase' : 'local'
