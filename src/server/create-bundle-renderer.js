import runInVm from './run-in-vm'
import { PassThrough } from 'stream'

export function createBundleRendererCreator (createRenderer) {
  return (code, rendererOptions) => {
    const renderer = createRenderer(rendererOptions)
    return {
      renderToString: (context, cb) => {
        if (typeof context === 'function') {
          cb = context
          context = {}
        }
        runInVm(code, context).then(app => {
          renderer.renderToString(app, cb)
        }).catch(cb)
      },
      renderToStream: (context, hook) => {
        const res = new PassThrough()
        runInVm(code, context).then(module => {
          return module.exports ? module.exports(context) : module
        }).then(app => {
          return (hook && hook(app)) || app
        }).then(app => {
          renderer.renderToStream(app).pipe(res)
        }).catch(err => {
          process.nextTick(() => {
            res.emit('error', err)
          })
        })
        return res
      }
    }
  }
}
