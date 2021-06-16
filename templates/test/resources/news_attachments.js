(function() {

  addEventListener("trix-attachment-add", (event) => {
           uploadFile(event.attachment, setProgress, setAttributes);
            function setProgress(progress) {
              event.attachment.setUploadProgress(progress)
            }

            function setAttributes(data) {
              console.log(event.attachment);
            }
});

function uploadFile(attachment, progressCallback, successCallback) {

            // Check File
            let file = attachment.file;
            var xhr = new XMLHttpRequest()

            xhr.open('POST', '/public-upload/', true)

            xhr.upload.addEventListener("progress", function(event) {
                var progress = event.loaded / event.total * 100
                progressCallback(progress)
            })

            xhr.addEventListener("load", function(event) {
              if (xhr.status == 200) {

                let data = {url : `/${xhr.responseText}`};
                setContent( attachment, data);
                successCallback(data);
              }
            });
            xhr.send(file);
        }

/**
 *  @param object attachment  struct of  attachment
 *  @param object data  remote server response data after upload.
 */
function setContent( attachment, data ) {

            let file = attachment.file;
            let attributes ={
                previewable: false,
                url: data.url,
                href: data.url
            };
            if ( file.type.includes("image") ) { // image
                attributes["content"] = `
                    <span class="trix-preview-image" data-url="${data.url}"  data-name="${file.name}" >
                        <img src="${data.url}" class="rounded img-fluid" />
                    </span>
                `; 

            } else {
              attributes["content"] = `
                <a href=${data.url} download='${file.name}'>
                <span class="trix-preview-file" data-url="${data.url}"  data-name="${file.name}" >
                  ${file.name}
                </span>
                </a>
              `;
            }
            attachment.setAttributes(attributes);
        }
})();
