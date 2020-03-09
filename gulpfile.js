const currentTask   = process.env.npm_lifecycle_event
const del           = require('del')
const webpackStream = require('webpack-stream')
const browserSync   = require('browser-sync').create()
const gulp          = require('gulp')
const babel         = require('gulp-babel')
const uglify        = require('gulp-uglify')
const rename        = require('gulp-rename')
const sourcemaps    = require('gulp-sourcemaps')
const imagemin      = require('gulp-imagemin')
const htmlmin       = require('gulp-htmlmin')
const autoprefixer  = require('gulp-autoprefixer')
const usemin        = require('gulp-usemin')
const rev           = require('gulp-rev')
const cleanCSS      = require('gulp-clean-css')
const sass          = require('gulp-sass')
sass.compiler       = require('node-sass')

const PUBLISH_DIRECTORY = 'docs'

let mode = currentTask === 'build' ? 'production' : 'development'

function startBrowserSync(dirname, port = 3000) {
  browserSync.init({
    notify: false,
    port: port,
    server: {
      baseDir: dirname
    }
  });
}

function reloadBrowser(done) {
  browserSync.reload();
  done();
}

function styles() {
  return gulp
    .src('src/assets/scss/index.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(rename({
      basename: 'bundle',
      extname: ".css"
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./src/temp'))
    .pipe(browserSync.stream())
}

function scripts() {
  return gulp
    .src('src/assets/js/index.js')
    .pipe(sourcemaps.init())
    .pipe(webpackStream({
      mode: mode
    }))
    .pipe(babel())
    .pipe(sourcemaps.write())
    .pipe(rename({
      basename: 'bundle',
      extname: ".js"
    }))
    .pipe(gulp.dest('./src/temp'))
}

function watch() {
  startBrowserSync('src')
  gulp.watch('./src/assets/scss/**/*.scss', styles)
  gulp.watch('./src/assets/js/**/*.js', gulp.series(scripts, reloadBrowser))
  gulp.watch('./src/*.html', reloadBrowser)
}

function buildProdHtmlCssAndJs() {
  return gulp
    .src('./src/*.html')
    .pipe(usemin({
      html: [ htmlmin({ collapseWhitespace: true }) ],
      css: [ rev(), cleanCSS() ],
      js: [ rev(), uglify() ]
    }))
    .pipe(gulp.dest(`./${PUBLISH_DIRECTORY}`))
}

function buildImages() {
  return gulp
    .src('./src/assets/images/**')
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
    .pipe(gulp.dest(`./${PUBLISH_DIRECTORY}/assets/images`))
}

function clean() {
  return del([`${PUBLISH_DIRECTORY}`, 'dist', 'docs']);
}

function previewDist() {
  startBrowserSync(`${PUBLISH_DIRECTORY}`, 3333)
}

exports.dev   = gulp.parallel(styles, scripts, watch)
exports.build = gulp.series(clean, gulp.parallel(buildProdHtmlCssAndJs, buildImages), previewDist)