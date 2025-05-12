# Billboard Sprite Generator

## Overview

The Billboard Sprite Generator is a simple web-based tool that allows users to upload 3D models in `.glb`, `.gltf`, or `.obj` format. The tool renders the models on a canvas and generates sprite sheets, which can be downloaded as PNG images. Additionally, the tool allows users to manipulate the model's scale, set the resolution of the generated sprites, and control the number of rotation steps used to generate the sprites.

This project uses [Three.js](https://threejs.org/), a JavaScript library for 3D graphics, to load and display 3D models in a web browser.

## Features

* **Model Upload:** Users can upload `.glb`, `.gltf`, or `.obj` files.
* **Model Visualization:** Models are displayed in a 3D viewport (canvas).
* **Sprite Generation:** The tool generates a sprite sheet (PNG) of the model at specified rotations and resolutions.
* **Model Manipulation:** Users can scale the model and adjust the resolution of the sprites.
* **Downloadable Spritesheet:** Once the sprite sheet is generated, users can download it.

## Requirements

* Modern web browser (Chrome, Firefox, Safari, etc.)
* JavaScript enabled

## Installation & Setup

1.  **Clone or Download the Repository**

    To use the Billboard Sprite Generator, clone this repository or download it as a ZIP file.

    ```bash
    git clone [https://github.com/yourusername/billboard-gen.git](https://github.com/n02448428/billboard-gen-gui.git)
    ```

    Alternatively, you can download it directly from GitHub.

2.  **Folder Structure**

    Once the repository is downloaded or cloned, the folder structure should look like this:

    ```
    billboard-gen/
    ├── index.html
    ├── main.js
    ├── spritegen.js
    ├── style.css
    ├── libs/
    │   ├── three.module.js
    │   ├── GLTFLoader.js
    │   ├── OBJLoader.js
    └── README.md
    ```

3.  **Run the Project Locally**

    To run the Billboard Sprite Generator locally, simply open the `index.html` file in your web browser.

    * Navigate to the project folder.
    * Open `index.html` in any modern browser.

## Usage

1.  **Upload Your 3D Model**

    Click the "Choose File" button to upload a `.glb`, `.gltf`, or `.obj` file. The model will appear in the 3D viewport.

2.  **Adjust Model Scale**

    You can scale the model using the Scale input. Adjust the scale between 0.1 and 10 to resize the model.

3.  **Set Resolution**

    Choose the resolution of the generated sprite sheet from the Resolution dropdown. The available options are:

    * 128x128
    * 256x256
    * 512x512

4.  **Set Steps (Rotations)**

    The Steps input controls the number of rotation angles used to generate the sprite sheet. The higher the number of steps, the more frames will be generated, resulting in a smoother sprite sheet (but larger file size).

5.  **Generate Sprite Sheet**

    Once you have uploaded your model and adjusted the settings, click "Generate Sprite". The tool will rotate the model, capture frames, and generate a sprite sheet.

6.  **Download the Sprite Sheet**

    Once the sprite sheet is generated, you will see a download link appear. Click the "Download Sprite" button to save the sprite sheet as a PNG file.

## Technology Stack

* **Three.js:** A JavaScript 3D library used to load and render 3D models.
* **GLTFLoader.js:** A Three.js loader used for loading `.gltf` and `.glb` files.
* **OBJLoader.js:** A Three.js loader used for loading `.obj` files.

## Files

* **index.html:** The main HTML file containing the structure of the tool, including the file upload form, controls, and canvas elements.
* **main.js:** The main JavaScript file that initializes the 3D scene using Three.js, loads models, and handles rendering.
* **spritegen.js:** Handles the sprite sheet generation. This script captures rotations of the model, creates individual frames, and compiles them into a downloadable sprite sheet.
* **style.css:** The styling file that controls the layout of the page, making the UI responsive and visually appealing.
* **libs/:** This folder contains the Three.js library and its loaders (`GLTFLoader.js` and `OBJLoader.js`), which are included from CDN sources.

## Contributing

Feel free to fork the repository and submit pull requests for improvements. If you have any bug reports or feature suggestions, open an issue on GitHub.

### How to Contribute

* Fork the repository.
* Create a new branch for your feature or bug fix.
* Implement your changes.
* Submit a pull request with a description of your changes.

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

## Acknowledgements

* **Three.js:** A powerful 3D library used for rendering models and creating the 3D scene.
* **GLTFLoader.js and OBJLoader.js:** Loaders used to handle `.gltf`, `.glb`, and `.obj` formats.

## Contact

For questions or issues related to the Billboard Sprite Generator, please open an issue in this repository or contact the repository owner at dmarkelo89@gmail.com.
