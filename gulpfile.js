const gulp = require('gulp'), // Сам сборщик
  gulpLess = require('gulp-less'), // Препроцессор Less
  delFolder = require('del'),
  gulpSass = require('gulp-sass'), // модуль для компиляции SASS (SCSS) в CSS
  fileinclude = require('gulp-file-include'),
  concat = require('gulp-concat'), // Соединение в один файл
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'), // Для прописывания префиксов
  precss = require('precss'),
  rename = require('gulp-rename'),
  cssnano = require('cssnano'), // Для отимизации и минификации выходных стилей
  sync = require('browser-sync').create() // Локальный сервер

const dirRoot = './'
const build = './build'
const src = './src'
const prod = './public'
const assets = '/assets'
const less = '/less'
const css = '/css'
const fonts = '/fonts'
const js = '/js'
const img = '/img'
const jsLib = '/lib'

const path = {
  build: {
    build: `${build}/`,
    assets: `${build}${assets}/`,
    html: `${build}/`,
    css: `${build}${assets}/css/`,
    js: `${build}${assets}${js}/`,
    fonts: `${build}${assets}${fonts}/`,
    lib: `${build}${assets}${jsLib}/`,
    img: `${build}${assets}${img}/`,
    static: `${build}/static-temp/`
  },
  copy: {
    img: `${src}${assets}${img}/**`,
    fonts: `${src}${assets}${fonts}/**`,
    js: `${src}${assets}${js}/**`,
    lib: `${src}${assets}${jsLib}/**`,
    static: `${src}/static-temp/**`,
    favicon: `${src}/favicon/**`,
  },
  buildProd: {
    assets: `${prod}${assets}/`,
    css: `${prod}${assets}${css}`,
    fonts: `${prod}${assets}${fonts}`,
    lib: `${prod}${assets}${jsLib}`,
    js: `${prod}${assets}${js}`,
    img: `${prod}${assets}${img}`,
  },
  src: {
    html: [`${src}/pages/**/*.html`, `!${src}/pages/**/_*.html`],
    less: `${src}${assets}${less}/`,
  },
  watch: {
    html: `${src}/pages/**/*.html`,
    less: `${src}${assets}${less}/**/*.less`,
    img: `${src}${assets}${img}/**`,
    static: `${src}/static-temp/**`,
    lib: `${src}${assets}${jsLib}/**`,
    fonts: `${src}${assets}${fonts}/**`,
    favicon: `${src}/favicon/**`,
  },
  serveBaseDir: `${build}/`,
  baseSrcMap: `${dirRoot}`,
  owlStylesSrc: `${src}${assets}${less}/libs/`,
}
const configPlugin = {
  server: {
    server: {
      baseDir: path.serveBaseDir,
    },
  },
  fileinclude: {
    prefix: '@@',
    basepath: '@file',
    indent: true,
  },
  cssnano: {
    cssDeclarationSorter: true,
    discardComments: {
      removeAll: true,
    },
  },
  autoprefixDev: {
    add: false,
    overrideBrowserslist: ['last 1 version'],
  },
  autoprefixProd: {
    overrideBrowserslist: ['last 40 version'],
  },
  postcss: {
    prod: [
      precss(),
      autoprefixer(this.autoprefixProd),
      // cssnano(configPlugin.cssnano)
    ],
    dev: [precss(), autoprefixer(this.autoprefixDev)],
  },
}

// Очищение директории перед сборкой
function cleanFolder(remove) {
  if (typeof remove === 'string') {
    return delFolder(remove)
  } else if (typeof remove === 'Array') {
    return delFolder(remove)
  } else {
    return delFolder(path.build.build)
  }
}

function cleanFolderProd() {
  return delFolder([path.buildProd.fonts, path.buildProd.css, path.buildProd.js, path.buildProd.lib, path.buildProd.img])
}

function html() {
  return gulp.src(path.src.html).pipe(fileinclude(configPlugin.fileinclude)).pipe(gulp.dest(path.build.build))
}

function copyImg() {
  return gulp.src([`${src}${assets}${img}/**`]).pipe(gulp.dest(`${build}${assets}${img}/`))
}

function copyFavIcon() {
  return gulp.src(path.copy.favicon).pipe(gulp.dest(`${build}/favicon/`))
}

function copyFonts() {
  return gulp.src(path.copy.fonts).pipe(gulp.dest(path.build.fonts))
}

function copyLib() {
  return gulp.src(path.copy.lib).pipe(gulp.dest(path.build.lib))
}

function copyJs() {
  return gulp.src(path.copy.js).pipe(gulp.dest(path.build.js))
}

function copyStatic() {
  return gulp.src(path.copy.static).pipe(gulp.dest(path.build.static))
}

function copyFavIconProd() {
  return gulp.src([`${src}/favicon/**`]).pipe(gulp.dest(`${prod}/favicon/`))
}

function copyFontsProd() {
  return gulp.src(path.copy.fonts).pipe(gulp.dest(path.buildProd.fonts))
}

function copyLibProd() {
  return gulp.src(path.copy.lib).pipe(gulp.dest(path.buildProd.lib))
}

function copyJsProd() {
  return gulp.src(path.copy.js).pipe(gulp.dest(path.buildProd.js))
}

function copyImgProd() {
  return gulp.src(path.copy.img).pipe(gulp.dest(path.buildProd.img))
}

const fileStyle = [
  {
    src: `${path.src.less}style.less`,
    outName: 'style.css',
    engine: gulpLess,
  }
]

function validateDir(dir) {
  let pathDir

  if (typeof dir === 'string' && dir.length) {
    pathDir = dir
  } else {
    pathDir = path.build.css
  }
  console.log(`out build path: ${pathDir}`)

  return pathDir
}

function style(confPostcss, dir, buildDir, name, preprocess) {
  console.log(`src: ${dir};`)
  console.log(`out name: ${name}`)
  return gulp
    .src(dir, {
      sourcemaps: true,
      since: gulp.lastRun(style),
    })
    .pipe(
      preprocess().on('error', function (error) {
        console.error(error)
      }),
    )
    .pipe(postcss(confPostcss))
    .pipe(concat(name))
    .pipe(
      gulp
        .dest(validateDir(buildDir), {
          sourcemaps: '.',
        })
        .on('end', function () {
          console.log(`done: ${name}`)
        }),
    )
    .pipe(sync.stream())
}

function styleProd(confPostcss, dir, buildDir, name, preprocess) {
  console.log(`src: ${dir};`)
  console.log(`out name: ${name}`)
  return gulp
    .src(dir)
    .pipe(
      preprocess().on('error', function (error) {
        console.error(error)
      }),
    )
    .pipe(postcss(confPostcss))
    .pipe(concat(name))
    .pipe(
      gulp.dest(validateDir(buildDir)).on('end', function () {
        console.log(`done: ${name}`)
      }),
    )
}

function dev(cb) {
  cleanFolder()
  fileStyle.forEach(function (file) {
    console.dir(file)
    style(configPlugin.postcss.dev, file.src, '', file.outName, file.engine)
  })
  cb()
}

function production(cb) {
  fileStyle.forEach(function (file) {
    styleProd(configPlugin.postcss.prod, file.src, path.buildProd.css, file.outName, file.engine)
  })
  cb()
}

function watch() {
  gulp.watch(path.watch.less, function (cb) {
    cleanFolder(`${path.build.css}${fileStyle[0].outName}`)
    style(configPlugin.postcss.dev, fileStyle[0].src, '', fileStyle[0].outName, fileStyle[0].engine)
    cb()
  })
  gulp.watch(path.watch.img, copyImg).on('change', sync.reload)
  gulp.watch(path.watch.static, copyStatic).on('change', sync.reload)
  gulp.watch(path.watch.fonts, copyFonts)
  gulp.watch(path.watch.lib, copyLib)
  gulp.watch(path.watch.html, html).on('change', sync.reload)
}

function watchProd() {
  gulp.watch(path.watch.less, function (cb) {
    cleanFolder(`${path.buildProd.css}${fileStyle[0].outName}`)
    style(configPlugin.postcss.prod, fileStyle[0].src, path.buildProd.css, fileStyle[0].outName, fileStyle[0].engine)
    cb()
  })
}

function serve() {
  sync.init(configPlugin.server)
  watch()
}

// Следим за изменениями
exports.default = watch
exports.watch = watch
exports.watchProd = watchProd

exports.serve = gulp.series(cleanFolder, gulp.parallel(dev, html, copyFonts, copyImg, copyFavIcon, copyStatic, copyJs, copyLib), serve)
exports.html = html

exports.style = function (cb) {
  cleanFolder(`${path.build.css}${fileStyle[0].outName}`), style(configPlugin.postcss.dev, fileStyle[0].src, '', fileStyle[0].outName, fileStyle[0].engine)
  cb()
}

exports.dev = gulp.series(cleanFolder, dev, gulp.parallel(copyFavIcon, copyFonts, copyImg, copyJs, copyLib, copyStatic, html))
exports.prod = gulp.series(cleanFolderProd, production, gulp.parallel(copyFavIconProd, copyFontsProd, copyImgProd, copyJsProd, copyLibProd))

/*
 ** Чтобы работала команда "gulp", установить глобально npm-пакет:
 ** 1) npm install gulp gulp-cli -g
 ** 2) gulp -v - для проверки, что пакет действительно установился глобально
 **
 **
 ** Для выпуска конечной сборки, но уже именно в проект, нужно запустить команду: gulp prod
 ** все операции по сборке, копированию, предварительной очистке конечных нужных директорий, перемещению
 ** файлов по очищенным директориям
 **
 ** Command terminal:
 **
 ** $command: "gulp dev" - Использовать только во время разработки
 ** $command: "gulp prod" - Для выкатывания, готовых файлов в проект
 ** $command: "gulp watchProd" - Просто следить за файлами и пересобирать, если что-то поменялось
 ** $command: "gulp serve" - Запуск локального сервера для верстки страниц
 ** $command: "gulp html" - Отдельно собрать html-страницы из кубиков
 ** $command: "gulp style" - Собираем стили less
 */
