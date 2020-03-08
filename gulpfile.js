const currentTask   = process.env.npm_lifecycle_event
const del           = require('del')
const webpack       = require('webpack-stream')
const browserSync   = require('browser-sync').create()
const gulp          = require('gulp')
const babel         = require('gulp-babel')
const uglify        = require('gulp-uglify')
const rename        = require('gulp-rename')
const sourcemaps    = require('gulp-sourcemaps')
const imagemin      = require('gulp-imagemin')
const htmlmin       = require('gulp-htmlmin')
const autoprefixer  = require('gulp-autoprefixer')
const sass          = require('gulp-sass')
sass.compiler       = require('node-sass')

let mode

if (currentTask === 'dev') {
  mode = 'development'
}

if (currentTask === 'build') {
  mode = 'production'
}

const paths = {
  htmls: {
    src: 'src/*.html',
    dest: 'dist'
  },
  styles: {
    src: 'src/scss/**/*.scss',
    dest: 'dist'
  },
  scripts: {
    src: 'src/scripts/**/*.js',
    dest: 'dist'
  },
  images: {
    src: 'src/images/**/*',
    dest: 'dist/images'
  },
  fonts: {
    src: 'src/fonts/**/*.*',
    dest: 'dist/fonts'
  }
};

// browser sync initialization function
function startBrowserSync() {
  browserSync.init({
    // injectChanges: false,
    notify: false,
    server: {
      baseDir: 'dist'
    }
  });
}

// reloading browser function
function reloadingBrowser(done) {
  browserSync.reload();
  done();
}

function clean() {
  return del([ 'dist' ]);
}

function styles() {
  return gulp
    .src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(rename({
      basename: 'bundle',
      suffix: '.min'
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.stream())
}

function scripts() {
  return gulp
    .src(paths.scripts.src)
    .pipe(sourcemaps.init())
    .pipe(webpack({
      output: {
        filename: 'bundle.min.js'
      },
      mode: mode,
    }))
    .pipe(babel())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.scripts.dest))
}

function optimizeImages() {
  return gulp
    .src(paths.images.src)
    .pipe(imagemin([
      imagemin.gifsicle({
        interlaced: true
      }),
      imagemin.mozjpeg({
        quality: 75,
        progressive: true
      }),
      imagemin.optipng({
        optimizationLevel: 5
      }),
      imagemin.svgo({
        plugins: [{
            removeViewBox: true
          },
          {
            cleanupIDs: false
          }
        ]
      })
    ]))
    .pipe(gulp.dest(paths.images.dest))
}

function copyImages() {
  return gulp
    .src(paths.images.src)
    .pipe(gulp.dest(paths.images.dest))
}

function copyFonts() {
  return gulp
    .src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dest))
}

function copyHtmls() {
  return gulp
    .src(paths.htmls.src)
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(paths.htmls.dest))
}

function watch() {
  gulp.watch(paths.styles.src, styles)
  gulp.watch(paths.scripts.src, gulp.series(scripts, reloadingBrowser))
  gulp.watch(paths.htmls.src, gulp.series(copyHtmls, reloadingBrowser))
  gulp.watch(paths.images.src, gulp.series(copyImages, reloadingBrowser))
  gulp.watch(paths.fonts.src, gulp.series(copyFonts, reloadingBrowser))
}

const dev = gulp.series(clean, gulp.parallel(startBrowserSync, copyHtmls, styles, scripts, copyImages, copyFonts, watch))
const build = gulp.series(clean, gulp.parallel(copyHtmls, styles, scripts, optimizeImages, copyFonts))


exports.dev = dev
exports.build = build
exports.default = dev