PATH = location.pathname.split('/')
LANGUAGE = PATH[1]



angular.module('hlpfc', [])



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
                url    : '/' + LANGUAGE + '/json/messages' + id_param
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
                    url    : '/' + LANGUAGE + '/json/messages/' + id
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
                    url    : '/' + LANGUAGE + '/json/messages/' + $scope.id,
                    data   : { 'message': $scope.message }
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
