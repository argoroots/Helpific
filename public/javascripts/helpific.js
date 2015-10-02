angular.module('hlpfc', ['ngRoute'])


// CONFIG
    .config(function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(true)
        $routeProvider
            .when('/:lang/users', {
                controller: 'usersCtrl'
            })
            .when('/:lang/messages/:id', {
                controller: 'messagesCtrl'
            })
            .otherwise({
                redirectTo: '/'
            })
    })



// USERS
    .controller('usersCtrl', function($scope, $http, $routeParams) {
        var path = location.pathname.split('/')
        $http({method: 'GET', url: '/' + path[1] + '/users/json'}).success(function(data) {
            $scope.users = data
        })
    })



// MESSAGES
    .controller('messagesCtrl', function($scope, $http, $routeParams) {
        var path = location.pathname.split('/')
        var id = ''

        if(path[3]) {
            var id = '?id=' + path[3]
            $scope.selected = parseInt(path[3])
            $http({method: 'GET', url: '/' + path[1] + '/messages/' + path[3] + '/json'}).success(function(data) {
                $scope.messages = data
            })
        }

        $http({method: 'GET', url: '/' + path[1] + '/messages/json' + id}).success(function(data) {
            $scope.conversations = data
        })

        $scope.openConversation = function(id) {
            if(path.length === 4) path.pop()
            path.push(id)
            location.href = path.join('/')
        }
    })
