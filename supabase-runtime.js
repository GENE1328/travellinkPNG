/* Classic bootstrap: expose the adapter promise before script.js registers handlers. */
window.EMDI_SUPABASE_READY = import('./supabase-adapter.js')
  .then(function (module) { return module.createEmdiSupabaseAdapter(window.EMDI_SUPABASE_CONFIG); })
  .catch(function (error) {
    console.error('EMDI Supabase connection unavailable:', error);
    return null;
  });
