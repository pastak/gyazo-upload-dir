import {watch} from 'chokidar'
import Gyazo from 'gyazo-api'
import {ExifImage} from 'exif'
import {EventEmitter} from 'events'

export default class Uploader extends EventEmitter {
  constructor ({dir, accessToken}) {
    super()
    this.dir = dir
    this.gyazo = new Gyazo(accessToken)
    this.onAdd = this.onAdd.bind(this)
  }

  startWatch () {
    this.watcher = watch(this.dir, {
      ignoreInitial: true
    })
    this.watcher
      .on('add', this.onAdd)
      .on('error', err => this.emit('error', err))
  }

  onAdd (path, stat) {
    if (!(/\.(jpe?g|gif|png)$/i.test(path))) return
    setTimeout(() => this.onNewFile(path), 3000)
  }

  onNewFile (source) {
    this.emit('upload', source)
    new ExifImage({image: source}, (error, exifData) => {
        if (error) {
          console.log('Error: '+error.message)
        } else {
            const originalDate = Date.parse(
              exifData.exif.DateTimeOriginal
                .replace(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,'$1-$2-$3 $4:$5:$6')
            )
            / 1000
            this.gyazo
              .upload(source, {created_at: originalDate})
              .then(result => this.emit('success', {source, result}))
              .catch(err => this.emit('error', err))
        }
    })
  }
}
