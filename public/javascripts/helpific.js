PATH = location.pathname.split('/')
LANGUAGE = PATH[1]



angular.module('hlpfc', ['ngSanitize'])



// File input custom-on-change directive
    .directive('customOnChange', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.bind('change', scope.$eval(attrs.customOnChange))
            }
        }
    })



// INDEX
    .controller('indexCtrl', ['$scope', '$http', function($scope, $http) {
        $http({
                method : 'GET',
                url    : '/' + LANGUAGE + '/json'
            })
            .success(function(data) {
                $scope.info = data
            })
    }])



// HELP
    .controller('helpCtrl', ['$scope', '$http', function($scope, $http) {
        if(PATH[3] === 'requests') $scope.type = 'request'
        if(PATH[3] === 'offers') $scope.type = 'offer'

        $http({
                method : 'GET',
                url    : '/' + LANGUAGE + '/help/json/statuses'
            })
            .success(function(data) {
                $scope.statuses = data
            })

        $http({
                method : 'GET',
                url    : '/' + LANGUAGE + '/help/json'
            })
            .success(function(data) {
                $scope.help = []
                angular.forEach(data, function(value, key) {
                    value.time.old = value.time.value
                    value.location.old = value.location.value
                    value.request.old = value.request.value
                    value.status.old = value.status.value
                    $scope.help.push(value)
                })
            })

        $scope.formatTime = function(time) {
            var d = Date.parse(time)
            if(d) {
                return d.toString('dd.MM.yyyy HH:mm').replace(' 00:00', '')
            } else {
                return ''
            }
        }

        $scope.Add = function(type, data) {
            if(!type || !data) return
            if(!data.time || !data.location || !data.request) return

            $scope.adding = true
            data.type = type

            $http({
                    method : 'POST',
                    url    : '/' + LANGUAGE + '/help',
                    data   : data
                })
                .success(function(result) {
                    $scope.new.time = null
                    $scope.new.location = null
                    $scope.new.request = null
                    $scope.adding = false
                    $scope.add_new = false

                    window.location.reload()
                })
                .error(function(data) {
                    console.log(data)
                    $scope.adding = false
                })
        }

        $scope.Save = function(data) {
            $scope.saving = true

            var post_data = {}
            if(data.time.old != data.time.value) post_data.time = data.time
            if(data.location.old != data.location.value) post_data.location = data.location
            if(data.request.old != data.request.value) post_data.request = data.request
            if(data.status.old != data.status.value) post_data.status = data.status

            angular.forEach(post_data, function(value, key) {
                $http({
                        method : 'PUT',
                        url    : '/' + LANGUAGE + '/help/' + data.id,
                        data   : {
                            property: key,
                            id: value.id,
                            value: value.value,
                        }
                    })
                    .success(function(result) {
                        data[key].id = result.id
                        data[key].value = result.value
                        data[key].old = result.value

                        data.filter_status = data.status.value
                        data.editing = false
                        $scope.saving = false
                    })
                    .error(function(data) {
                        console.log(data)
                        $scope.saving = false
                    })
            })
        }
    }])



// USERS
    .controller('usersCtrl', ['$scope', '$http', function($scope, $http) {
        $http({
                method : 'GET',
                url    : '/' + LANGUAGE + '/users/json'
            })
            .success(function(data) {
                $scope.users = data
            })
    }])



// USER
    .controller('userCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.id = PATH[3]
        $http({
                method : 'GET',
                url    : '/' + LANGUAGE + '/help/json?id=' + $scope.id
            })
            .success(function(data) {
                $scope.help = data
            })
    }])



// MESSAGES
    .controller('messagesCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.id = PATH[3]
        var id_param = $scope.id ? '?new_id=' + $scope.id : ''

        $http({
                method : 'GET',
                url    : '/' + LANGUAGE + '/messages/json' + id_param
            })
            .success(function(data) {
                $scope.conversations = data
            })

        $scope.openConversation = function(id) {
            $scope.id = id
            $scope.selected = parseInt(id)
            $scope.loading = true

            $http({
                    method : 'GET',
                    url    : '/' + LANGUAGE + '/messages/json/' + id
                })
                .success(function(data) {
                    $scope.messages = data
                    $scope.loading = false
                })
        }

        $scope.sendMessage = function() {
            $scope.sending = true
            $http({
                    method : 'POST',
                    url    : '/' + LANGUAGE + '/messages/' + $scope.id,
                    data   : { message: $scope.message }
                })
                .success(function(data) {
                    var day_in_list = false
                    for(i in $scope.messages.days) {
                        if($scope.messages.days[i].relative_date === data.day.relative_date) {
                            day_in_list = true
                            break
                        }
                    }
                    for(i in $scope.conversations) {
                        if($scope.conversations[i].id === $scope.id) {
                            $scope.conversations[i].relative_date = data.message.relative_date
                            $scope.conversations[i].ordinal = data.message.message_id
                            break
                        }
                    }
                    if(!day_in_list) $scope.messages.days.push(data.day)

                    $scope.messages.messages.push(data.message)
                    $scope.message = ''
                    $scope.sending = false
                })
                .error(function(data) {
                    console.log(data)
                    $scope.sending = false
                })
        }

        if($scope.id) $scope.openConversation($scope.id)
    }])



// PROFILE
    .controller('profileCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.photoUpload = function(e) {
            var file = e.target.files[0]

            $http({
                    method : 'POST',
                    url    : '/' + LANGUAGE + '/profile/photo',
                    data   : {
                        filename: file.name,
                        filesize: file.size,
                        filetype: file.type
                    }
                })
                .success(function(data) {
                    var form = new FormData()
                    var xhr  = new XMLHttpRequest()

                    for(var i in data.s3.data) {
                        form.append(i, data.s3.data[i])
                    }
                    form.append('file', file)

                    xhr.upload.addEventListener('progress', function(ev) {
                        if(!ev.lengthComputable) return
                        $scope.photo_upload = (ev.loaded * 100 / ev.total - 0.1).toFixed(1)
                        $scope.$apply()
                    }, false)

                    xhr.onreadystatechange = function(ev) {
                        if(xhr.readyState != 4) return
                        if(xhr.status == 201) {
                            $scope.photo_upload = 100
                            $scope.$apply()
                            window.location.reload()
                        } else {
                            console.log(xhr)
                            $scope.photo_upload = null
                            $scope.$apply()
                        }
                    }

                    xhr.open('POST', data.s3.url, true)
                    xhr.send(form)
                })
                .error(function(data) {
                    console.log(data)
                    $scope.sending = false
                })
        }

        $scope.photoDelete = function(id) {
            $http({
                    method : 'POST',
                    url    : '/' + LANGUAGE + '/profile',
                    data   : {
                        property: 'photo',
                        id: id
                    }
                })
                .success(function(data) {
                    console.log(data)
                    window.location.reload()
                })
                .error(function(data) {
                    console.log(data)
                    $scope.sending = false
                })
        }
    }])
