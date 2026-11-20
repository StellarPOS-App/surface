/**
 * Copies text to the clipboard. navigator.clipboard only exists in secure
 * contexts, so Safari on a plain-http LAN address (common for shop iPads)
 * has none; fall back to a hidden textarea and execCommand('copy').
 * Resolves to whether the copy worked, and never throws.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or not focused: try the fallback below.
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  // Off-screen, and 16px so iOS does not zoom while it is focused.
  Object.assign(area.style, { position: 'fixed', top: '-1000px', fontSize: '16px' });
  document.body.append(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
