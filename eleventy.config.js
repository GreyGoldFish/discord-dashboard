import fs from "fs";
import path from "path";

import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';

// Define your project's directory structure
const dirs = {
    input: "src",
    output: "dist",
    styles: "styles",
};

// Define the path to your main CSS file
const paths = {
    tailwindcss: path.join(dirs.styles, "index.css"),
};

// Define the PostCSS plugins
const postcssPlugins = [
    tailwindcss(), // This plugin finds and uses your tailwind.config.js
];

// Add cssnano for production builds to minify CSS
if (process.env.NODE_ENV === "production") {
    postcssPlugins.push(cssnano({ preset: "default" }));
}

// Initialize the PostCSS processor
const processor = postcss(postcssPlugins);

export default async function(eleventyConfig) {
    // Watch for changes in our styles directory for hot-reloading
    eleventyConfig.addWatchTarget(path.join(dirs.input, dirs.styles));

    // Add a global data object for paths
    eleventyConfig.addNunjucksGlobal("paths", paths);

    // Process Tailwind CSS with PostCSS before Eleventy builds
    eleventyConfig.on("eleventy.before", async () => {
        const tailwindInputPath = path.join(dirs.input, paths.tailwindcss);
        const tailwindOutputPath = path.join(dirs.output, paths.tailwindcss);

        try {
            const css = fs.readFileSync(tailwindInputPath, "utf8");

            const result = await processor.process(css, {
                from: tailwindInputPath,
                to: tailwindOutputPath,
            });

            // Create the output directory if it doesn't exist
            const outputDir = path.dirname(tailwindOutputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Write the processed CSS to the output directory
            fs.writeFileSync(tailwindOutputPath, result.css);
            console.log(`Successfully processed Tailwind CSS to ${tailwindOutputPath}`);
        } catch (error) {
            console.error("Error processing Tailwind CSS with PostCSS:", error);
        }
    });

    // Return the configuration object
    return {
        dir: {
            input: dirs.input,
            output: dirs.output,
        },
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
    };
};