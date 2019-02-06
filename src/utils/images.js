export const loadImages = (map, images) => (
  images.map(imageURL => (
    new Promise((resolve, reject) => {
      if (!map.hasImage(imageURL)) {
        console.log(imageURL);
        map.loadImage(imageURL, (error, image) => {
          if (error) {
            console.error(new Error(error));
            resolve();
          } else {
            if (!map.hasImage(imageURL)) {
              map.addImage(imageURL, image);
              resolve();
            } else {
              resolve();
            }
          }
        });
      } else {
        resolve();
      }
    })
  ))
);
