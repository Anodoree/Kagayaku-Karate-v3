const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const del = require('del');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const beautify = require('gulp-beautify');
const concat = require('gulp-concat');
const panini = require('panini');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const svgSprite = require('gulp-svg-sprite');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');

// Paths --------------------------------------------------
const dev = 'source/';
const docs = 'docs/';

const path = {
    src: {
        html: dev + 'html/pages/**/*.html',
        css: dev + 'css/*.scss',
        js: dev + 'js/*.js',
        jsL: dev + 'js/libs/*.js',
        img: dev + 'img/**/*.*',
        icons: dev + 'img/icons/**/*.svg',
        fonts: dev + 'fonts/**/*.{woff,woff2}',
    },
    watch: {
        html: [dev + 'html/**/*.html', dev + 'html/**/*.yml'],
        css: dev + 'css/**/*.scss',
        js: dev + 'js/**/*.js',
        img: dev + 'img/**/*.*',
        icons: dev + 'img/icons/**/*.svg',
        fonts: dev + 'fonts/**/*.{woff,woff2}',
    },
    dest: {
        html: docs,
        css: docs + 'css/',
        js: docs + 'js/',
        img: docs + 'img/',
        icons: docs + 'img/',
        fonts: docs + 'fonts/',
    },
    clean: {
        docs: docs
    }
};

// Tasks --------------------------------------------------
function htmlF() {
    panini.refresh();
    return src(path.src.html)
        .pipe(panini({
            root: dev + 'html/pages/',
            layouts: dev + 'html/modules/layouts/',
            partials: dev + 'html/modules/partials/',
            data: dev + 'html/modules/data/'
        }))
        .pipe(beautify.html({
            end_with_newline: 'true',
            no_preserve_newlines: 'disables',
            indent_size: '4',
            indent_with_tabs: true,
            editorconfig: true,
            preserve_newlines: 'enabled',
            extra_liners: [
                'header',
                'main',
                'section',
                'article',
                'acide',
                'footer'
            ],
            wrap_attributes: 'preserve'
        }))
        .pipe(dest(path.dest.html))
        .pipe(browserSync.stream());
};

function cssF() {
    return src(path.src.css)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(beautify.css({
            indent_size: '4',
            indent_with_tabs: true,
            editorconfig: true
        }))
        .pipe(sourcemaps.write('maps/'))
        .pipe(dest(path.dest.css));
};

function cssFmin() {
    return src(path.src.css)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(csso())
        .pipe(sourcemaps.write('maps/'))
        .pipe(dest(path.dest.css))
        .pipe(browserSync.stream());
};

function jsF() {
    return src(path.src.js)
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(beautify.js({
            indent_size: '4',
            indent_with_tabs: true
        }))
        .pipe(dest(path.dest.js))
        .pipe(browserSync.stream());
};

function jsLibsF() {
    return src(path.src.jsL)
        .pipe(concat('libs.js'))
        .pipe(uglify())
        .pipe(dest(path.dest.js));
};

function imgF() {
    return src(path.src.img)
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 4}),
            imagemin.svgo({plugins: [{removeViewBox: false}, {cleanupIDs: false}]})
        ]))
        .pipe(dest(path.dest.img));
};

function svgF() {
    return src(path.src.icons)
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[fill-opacity]').removeAttr('fill-opacity');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: '../icons.svg'
                }
            }
        }))
        .pipe(dest(path.dest.icons))
        .pipe(browserSync.stream());
};

function fontsF() {
    return src(path.src.fonts)
        .pipe(dest(path.dest.fonts));
};

function cleanFdocs() {
    return del(path.clean.docs);
};

// Watching -----------------------------------------------
function watchingF() {
    browserSync.init({
        server: {
            baseDir: docs
        },
        notify: false
    });

    watch(path.watch.html, htmlF);
    watch(path.watch.css, cssF);
    watch(path.watch.css, cssFmin);
    watch(path.watch.js, jsF);
    watch(path.watch.icons, svgF);
    watch(path.watch.html).on('change', browserSync.reload);
};

// Exports ------------------------------------------------
exports.watch = watchingF;
exports.clean = cleanFdocs;
exports.html = htmlF;
exports.css = cssF;
exports.css = cssFmin;
exports.js = jsF;
exports.jsLibs = jsLibsF;
exports.img = imgF;
exports.svg = svgF;
exports.fonts = fontsF;

exports.default = series(cleanFdocs, parallel(fontsF, htmlF, cssF, cssFmin, jsF, jsLibsF, imgF, svgF), watchingF);
