/**
 * ✧･ﾟ: *✧･ﾟ:* PRODUCTION SERVER INITIALIZATION *:･ﾟ✧*:･ﾟ✧
 *
 * Production server with intelligent static asset loading (◕‿◕✿)
 */

export {
  compressDataIfAppropriate,
  computeEtag,
  convertGlobToRegExp,
  createCompositeGlobPattern,
  createResponseHandler,
  isFileEligibleForPreloading,
  isMimeTypeCompressible,
  loadStaticAssets,
} from './asset-loader'
export { createProductionServer } from './server'
