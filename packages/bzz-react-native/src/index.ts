import { Bzz, DirectoryData, Response, UploadOptions } from '@erebos/bzz'

export * from '@erebos/bzz'

export class BzzReactNative extends Bzz<
  NodeJS.ReadableStream,
  Response,
  FormData
> {
  public uploadDirectory(
    directory: DirectoryData,
    options: UploadOptions = {},
  ): Promise<string> {
    const form = new FormData()
    Object.keys(directory).forEach(key => {
      form.append(
        key,
        {
          uri: directory[key].data,
          type: directory[key].contentType,
          name: key,
        } as any,
        key,
      )
    })
    if (options.defaultPath != null) {
      const file = directory[options.defaultPath]
      if (file != null) {
        form.append(
          '',
          {
            uri: directory[options.defaultPath].data,
            type: directory[options.defaultPath].contentType,
            name: options.defaultPath,
          } as any,
          '',
        )
      }
    }
    return this.uploadBody(form, options)
  }
}
